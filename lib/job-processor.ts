
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { uploadWithThumbnail } from "@/lib/storage"

/**
 * Process a job in the background (Server-Side)
 * This function is designed to be called without awaiting, allowing "Fire and Forget"
 */
export async function processJobBackground(jobId: string) {
    console.log(`[JobProcessor] Starting background processing for Job ${jobId}`)

    try {
        const job = await prisma.generationJob.findUnique({ where: { id: jobId } })
        if (!job) return

        // Update status to PROCESSING
        await prisma.generationJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        })

        // Prepare Data
        let mainImageBase64 = ''
        let envImageBase64: string | undefined = undefined

        if (job.originalData.startsWith('{')) {
            try {
                const composite = JSON.parse(job.originalData)
                mainImageBase64 = composite.main
                envImageBase64 = composite.env
            } catch (e) {
                console.error("Failed to parse composite data", e)
                throw new Error("Invalid job data format")
            }
        } else {
            mainImageBase64 = job.originalData
        }

        // Handle URL inputs (if main image is R2 URL)
        if (mainImageBase64.startsWith('http')) {
            const resp = await fetch(mainImageBase64)
            const arrayBuffer = await resp.arrayBuffer()
            mainImageBase64 = Buffer.from(arrayBuffer).toString('base64')
        }

        // Generate
        console.log(`[JobProcessor] Calling Gemini for Job ${jobId}...`)
        const generatedBase64 = await generateImage(
            mainImageBase64,
            job.style,
            job.aspectRatio,
            envImageBase64
        )

        // Upload Result to R2
        console.log(`[JobProcessor] Generation successful, uploading to R2...`)
        let r2Url: string | null = null
        try {
            const buffer = Buffer.from(generatedBase64, 'base64')
            const uploadRes = await uploadWithThumbnail(buffer, 'results', true)
            r2Url = uploadRes.url
        } catch (uploadError) {
            console.error("[JobProcessor] R2 Upload failed", uploadError)
        }

        // Complete Job
        await prisma.generationJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                resultData: generatedBase64,
                resultUrl: r2Url || undefined,
                completedAt: new Date()
            }
        })

        console.log(`[JobProcessor] Job ${jobId} Completed.`)

    } catch (error: any) {
        console.error(`[JobProcessor] Job ${jobId} Failed:`, error)
        await prisma.generationJob.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                errorMessage: error.message || "Unknown error",
                completedAt: new Date()
            }
        })
    }
}
