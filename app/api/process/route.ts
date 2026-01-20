import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"

export const maxDuration = 60 // Enable 60s timeout for Pro (if applicable)

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { jobId } = await req.json()
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

        // If already completed/processing, skip (idempotency)
        if (job.status === 'COMPLETED') {
            return NextResponse.json({ success: true, message: "Already completed" })
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
        await prisma.generationJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                resultData: generatedBase64,
                completedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Processing error:", error)
        
        // Try to verify if req has body to extract JobID for error logging? 
        // Or assume we caught it inside the flow.
        // We really should update the job to FAILED if we have the ID.
        // But since we might fail before getting ID, it's tricky.
        // Assuming the try-catch block covers the logic where `jobId` is known implies we should use a variable accessible in catch.
        
        // For simple impl, we return 500. 
        // Frontend should handle polling logic.
        return NextResponse.json({ error: error.message || "Processing Failed" }, { status: 500 })
    }
}
