import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processJobBackground } from "@/lib/job-processor"

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

        // Fire and forget
        processJobBackground(jobId).catch(err => console.error("Manual trigger failed:", err))

        return NextResponse.json({ success: true, message: "Started" })

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
