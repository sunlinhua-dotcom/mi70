import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { uploadWithThumbnail } from "@/lib/storage"

export const maxDuration = 180  // 3 minutes

// 处理一个待处理的任务
export async function POST(req: Request) {
    // 简单的密钥验证（防止外部调用）
    const authHeader = req.headers.get('x-process-key')
    if (authHeader !== 'internal-job-processor') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // 获取一个待处理任务
        const job = await prisma.generationJob.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        })

        if (!job) {
            return NextResponse.json({ message: "No pending jobs" })
        }

        // 标记为处理中
        await prisma.generationJob.update({
            where: { id: job.id },
            data: { status: 'PROCESSING' }
        })

        console.log(`[JobProcessor] Processing job ${job.id}`)

        try {
            // Prepare the image data - handle both URL and Base64
            let base64Data = job.originalData

            // If originalData is a URL (starts with http), fetch it and convert to base64
            if (job.originalData.startsWith('http')) {
                console.log('[JobProcessor] Fetching image from R2 URL...')
                try {
                    const imageResponse = await fetch(job.originalData)
                    if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
                    }
                    const arrayBuffer = await imageResponse.arrayBuffer()
                    base64Data = Buffer.from(arrayBuffer).toString('base64')
                    console.log('[JobProcessor] Image fetched and converted to base64, length:', base64Data.length)
                } catch (fetchErr: any) {
                    console.error('[JobProcessor] Failed to fetch R2 image:', fetchErr.message)
                    throw new Error('Failed to load original image from storage')
                }
            }

            // 生成图片 - pass aspectRatio
            const generatedBase64 = await generateImage(base64Data, job.style, job.aspectRatio || '1:1')

            // Convert and Upload to R2 with thumbnail
            let finalResult = generatedBase64
            try {
                const buffer = Buffer.from(generatedBase64, 'base64')
                const { url: r2Url } = await uploadWithThumbnail(buffer, 'results')
                if (r2Url) {
                    finalResult = r2Url
                    console.log(`[JobProcessor] Uploaded result to R2: ${r2Url}`)
                }
            } catch (uErr) {
                console.error('[JobProcessor] R2 upload failed, falling back to Base64:', uErr)
            }

            // 更新任务状态
            await prisma.generationJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    resultData: finalResult, // URL or Base64
                    completedAt: new Date()
                }
            })

            console.log(`[JobProcessor] Job ${job.id} completed`)

            return NextResponse.json({
                success: true,
                jobId: job.id,
                resultData: generatedBase64 // Return base64 for immediate preview if needed, or URL
            })

        } catch (genError: any) {
            // 生成失败
            await prisma.generationJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    errorMessage: genError.message
                }
            })

            console.error(`[JobProcessor] Job ${job.id} failed:`, genError.message)

            return NextResponse.json({
                success: false,
                jobId: job.id,
                error: genError.message
            })
        }

    } catch (error: any) {
        console.error("Job processor error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
