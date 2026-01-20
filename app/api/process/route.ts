import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { uploadWithThumbnail } from "@/lib/storage"

export const maxDuration = 60 // Enable 60s timeout for Pro (if applicable)

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let jobId = ''

    try {
        const body = await req.json()
        jobId = body.jobId
        if (!jobId) {
            return NextResponse.json({ error: "Missing Job ID" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const job = await prisma.generationJob.findUnique({
            where: { id: jobId }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (job.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // If already completed skip
        if (job.status === 'COMPLETED') {
            return NextResponse.json({ success: true, message: "Already completed" })
        }

        // If processing but started > 5 mins ago, allow retry
        if (job.status === 'PROCESSING') {
            // We don't have a 'processingStartedAt' in schema, so let's just use regular idempotency for now
            // return NextResponse.json({ success: true, message: "Already processing" })
        }

        // Update status to PROCESSING
        await prisma.generationJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        })

        // Prepare Data
        let mainImageBase64 = ''
        let envImageBase64: string | undefined = undefined

        if (job.originalData.startsWith('{')) {
            // Composite Data (JSON)
            try {
                const composite = JSON.parse(job.originalData)
                mainImageBase64 = composite.main
                envImageBase64 = composite.env
            } catch (e) {
                console.error("Failed to parse composite data", e)
                throw new Error("Invalid job data format")
            }
        } else {
            // Simple Base64 or URL
            mainImageBase64 = job.originalData
        }

        // Handle URL inputs (if main image is R2 URL)
        if (mainImageBase64.startsWith('http')) {
            const resp = await fetch(mainImageBase64)
            const arrayBuffer = await resp.arrayBuffer()
            mainImageBase64 = Buffer.from(arrayBuffer).toString('base64')
        }

        // Generate
        console.log(`[Process] Starting generation for Job ${jobId}, Style: ${job.style}`)
        const generatedBase64 = await generateImage(
            mainImageBase64,
            job.style,
            job.aspectRatio,
            envImageBase64
        )

        // Save Result
        console.log(`[Process] Generation successful for Job ${jobId}, uploading to R2...`)

        let r2Url: string | null = null
        try {
            const buffer = Buffer.from(generatedBase64, 'base64')
            const uploadRes = await uploadWithThumbnail(buffer, 'results', true)
            r2Url = uploadRes.url
        } catch (uploadError) {
            console.error("[Process] Failed to upload result to R2, falling back to database storage only", uploadError)
        }

        await prisma.generationJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                resultData: generatedBase64,
                resultUrl: r2Url || undefined,
                completedAt: new Date()
            }
        })

        console.log(`[Process] Job ${jobId} finished successfully. R2: ${!!r2Url}`)

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Processing error:", error)

        // Update job to FAILED state so it doesn't hang forever
        try {
            if (jobId) {
                await prisma.generationJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        errorMessage: error.message || "Unknown processing error",
                        completedAt: new Date()
                    }
                })
            }
        } catch (dbError) {
            console.error("Failed to update job status to FAILED", dbError)
        }

        return NextResponse.json({ error: error.message || "Processing Failed" }, { status: 500 })
    }
}
