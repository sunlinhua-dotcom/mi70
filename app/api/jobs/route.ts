import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 提交新的生成任务
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const style = formData.get('style') as string

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
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        // 将图片转为 base64
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64Data = buffer.toString('base64')

        // 创建任务记录
        const job = await prisma.generationJob.create({
            data: {
                userId: user.id,
                originalData: base64Data,
                style: style,
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
            take: 20  // 最近 20 个任务
        })

        return NextResponse.json({
            success: true,
            jobs: jobs.map(j => ({
                id: j.id,
                style: j.style,
                status: j.status,
                originalData: j.originalData,
                resultUrl: j.resultUrl,
                resultData: j.resultData, // Include Base64 data
                errorMessage: j.errorMessage,
                createdAt: j.createdAt,
                completedAt: j.completedAt
            })),
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
