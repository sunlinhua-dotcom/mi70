import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import sharp from 'sharp'
import { uploadWithThumbnail } from "@/lib/storage"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { processJobBackground } from "@/lib/job-processor"

// 提交新的生成任务
export async function POST(req: Request) {
    // 限流检查：10 请求/分钟
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(clientIP, { maxRequests: 10, windowMs: 60 * 1000 })
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "请求过于频繁，请稍后再试" },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
        )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const envFile = formData.get('envFile') as File | null
        const style = formData.get('style') as string
        const aspectRatio = (formData.get('aspectRatio') as string) || '1:1'

        console.log('[API] Received job request:', { style, aspectRatio, hasFile: !!file, hasEnvFile: !!envFile })

        if (!file || !style) {
            return NextResponse.json({ error: "Missing file or style" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isSuperUser = user.username === 'sbrain' || user.role === 'ADMIN'

        if (!isSuperUser && user.credits < 1) {
            // return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        // 将图片转为 base64
        const buffer = Buffer.from(await file.arrayBuffer())

        // 尝试使用 sharp 压缩（如果失败则用原图）
        let processedBuffer: Buffer = buffer
        let base64Data: string
        try {
            const compressedBuffer = await sharp(buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer()
            processedBuffer = compressedBuffer as Buffer
            base64Data = processedBuffer.toString('base64')
        } catch (e) {
            console.warn('[Jobs] Sharp compression failed, using original:', e)
            base64Data = buffer.toString('base64')
        }

        // Try uploading to R2 with thumbnail
        const { url: r2Url } = await uploadWithThumbnail(processedBuffer, 'originals')

        let finalData = r2Url || base64Data

        // If environment file exists, pack both into a JSON structure
        // This avoids schema migration for now
        if (envFile) {
            const envBuffer = Buffer.from(await envFile.arrayBuffer())
            let processedEnvBuffer: Buffer = envBuffer
            try {
                processedEnvBuffer = await sharp(envBuffer)
                    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer()
            } catch (err) {
                console.error('Environment image processing failed, using original', err)
            }
            const envBase64 = processedEnvBuffer.toString('base64')

            // Construct composite data object
            const compositeData = {
                main: finalData, // URL or Base64 of food
                env: envBase64,  // Base64 of environment
                isComposite: true
            }
            finalData = JSON.stringify(compositeData)
        }

        if (r2Url) console.log('[Jobs] Uploaded to R2 with thumbnail:', r2Url)

        // 创建任务记录
        const job = await prisma.generationJob.create({
            data: {
                userId: user.id,
                originalData: finalData, // 存 URL 或 Base64
                style: style,
                aspectRatio: aspectRatio,
                status: 'PENDING'
            }
        })

        // 先扣积分
        if (!isSuperUser) {
            await prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            })
        }

        // 如果支持 waitUntil (Vercel/Cloudflare)，使用它来确保后台任务完成
        // 对于 Node.js 服务器（如 Zeabur），不等待 promise 即可异步执行
        // Fire and forget - The server will continue processing
        processJobBackground(job.id).catch(err => console.error("Background trigger failed:", err))

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: "任务已自动开始处理，请前往历史记录查看"
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Error"
        console.error("Job error:", error)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}

// 获取用户的任务列表
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '15')
        const skip = (page - 1) * limit

        const user = await prisma.user.findUnique({
            where: { username: session.user.name },
            select: { id: true, credits: true } // Only select needed fields
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get total count for pagination
        const totalCount = await prisma.generationJob.count({
            where: { userId: user.id }
        })

        // Optimized query - don't fetch heavy base64 data, only URLs
        const jobs = await prisma.generationJob.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limit,
            select: {
                id: true,
                style: true,
                status: true,
                originalData: true,
                resultData: true,
                aspectRatio: true,
                errorMessage: true,
                createdAt: true
            }
        })

        const hasMore = totalCount > (page * limit)
        // Check if there are ANY pending jobs for this user (not just on the current page)
        const pendingCount = await prisma.generationJob.count({
            where: { userId: user.id, status: 'PENDING' }
        })

        const response = NextResponse.json({
            success: true,
            totalCount,
            hasMore,
            hasPending: pendingCount > 0,
            currentPage: page,
            jobs: jobs.map(j => {
                const isOriginalUrl = j.originalData?.startsWith('http')
                const isResultUrl = j.resultData?.startsWith('http')

                return {
                    id: j.id,
                    style: j.style,
                    status: j.status,
                    aspectRatio: j.aspectRatio,
                    // 如果是 Base64，返回代理 URL 而非原始数据，极大减小 JSON 体积
                    originalUrl: isOriginalUrl ? j.originalData : `/api/images?id=${j.id}&type=original`,
                    resultUrl: isResultUrl ? j.resultData : (j.resultData ? `/api/images?id=${j.id}&type=result` : undefined),
                    errorMessage: j.errorMessage,
                    createdAt: j.createdAt
                }
            }),
            credits: user.credits
        })

        // Add cache headers for 5 seconds (stale-while-revalidate)
        response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=10')

        return response

    } catch (error: any) {
        console.error("Job list error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}

// 删除任务
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 验证归属权
        const job = await prisma.generationJob.findUnique({
            where: { id }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (job.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.generationJob.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Job delete error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}
