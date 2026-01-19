import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import sharp from 'sharp'
import { uploadToR2 } from "@/lib/storage"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

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
        const style = formData.get('style') as string
        const aspectRatio = (formData.get('aspectRatio') as string) || '1:1'

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

        // 尝试上传到 R2
        const r2Url = await uploadToR2(processedBuffer, 'image/jpeg', 'originals')
        const finalData = r2Url || base64Data
        if (r2Url) console.log('[Jobs] Uploaded to R2:', r2Url)

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

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: "任务已提交，可以离开页面，稍后回来查看结果"
        })

    } catch (error: any) {
        console.error("Job submit error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}

// 获取用户的任务列表
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const jobs = await prisma.generationJob.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                style: true,
                status: true,
                originalData: true, // Fetch this now to check if it's a URL
                resultUrl: true,
                resultData: true,   // Fetch this now to check if it's a URL
                aspectRatio: true,
                errorMessage: true,
                createdAt: true
            }
        })

        return NextResponse.json({
            success: true,
            jobs: jobs.map(j => {
                // Determine if we should send the data field directly (if URL) or null (if heavy Base64)
                const isOriginalUrl = j.originalData && j.originalData.startsWith('http') && j.originalData.length < 1000
                const isResultUrlData = j.resultData && j.resultData.startsWith('http') && j.resultData.length < 1000

                // If it's a URL in resultData, we can map it to resultUrl if resultUrl is empty
                let finalResultUrl = j.resultUrl
                if (!finalResultUrl && isResultUrlData) {
                    finalResultUrl = j.resultData
                }

                return {
                    id: j.id,
                    style: j.style,
                    status: j.status,
                    aspectRatio: j.aspectRatio,
                    // Send originalUrl if it's R2, otherwise rely on lazy loading
                    originalUrl: isOriginalUrl ? j.originalData : undefined,
                    resultUrl: finalResultUrl,
                    errorMessage: j.errorMessage,
                    createdAt: j.createdAt
                }
            }),
            credits: user.credits
        })

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
