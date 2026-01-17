import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
            // 生成图片
            const generatedBase64 = await generateImage(job.originalData, job.style)

            // 保存到磁盘
            const generatedDir = path.join(process.cwd(), 'public', 'generated-images')
            try { await mkdir(generatedDir, { recursive: true }) } catch (e) { }

            const fileName = `${uuidv4()}.jpg`
            const filePath = path.join(generatedDir, fileName)
            const imageBuffer = Buffer.from(generatedBase64, 'base64')
            await writeFile(filePath, imageBuffer)

            const resultUrl = `/generated-images/${fileName}`

            // 更新任务状态
            await prisma.generationJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    resultUrl: resultUrl,
                    completedAt: new Date()
                }
            })

            console.log(`[JobProcessor] Job ${job.id} completed`)

            return NextResponse.json({
                success: true,
                jobId: job.id,
                resultUrl: resultUrl
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
