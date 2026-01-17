import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 180  // 3 minutes timeout

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

        const generatedDir = path.join(process.cwd(), 'public', 'generated-images')
        try { await mkdir(generatedDir, { recursive: true }) } catch (e) { }

        // Convert file to base64
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64Input = buffer.toString('base64')

        // 保存原图
        const originalFileName = `original_${uuidv4()}.jpg`
        const originalFilePath = path.join(generatedDir, originalFileName)
        await writeFile(originalFilePath, buffer)
        const originalUrl = `/generated-images/${originalFileName}`

        // Generate image with AI
        const generatedBase64 = await generateImage(base64Input, style)

        // Save generated image
        const generatedFileName = `${uuidv4()}.jpg`
        const generatedFilePath = path.join(generatedDir, generatedFileName)
        const generatedBuffer = Buffer.from(generatedBase64, 'base64')
        await writeFile(generatedFilePath, generatedBuffer)
        const generatedUrl = `/generated-images/${generatedFileName}`

        // Record in DB
        const imageRecord = await prisma.image.create({
            data: {
                userId: user.id,
                originalUrl: originalUrl,
                generatedUrl: generatedUrl,
                style: style,
                status: "COMPLETED"
            }
        })

        // Deduct 1 credit
        if (!isSuperUser) {
            await prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            })
        }

        const newCredits = isSuperUser ? user.credits : user.credits - 1

        return NextResponse.json({
            success: true,
            image: {
                id: imageRecord.id,
                originalUrl: originalUrl,
                generatedUrl: generatedUrl,
                style: style
            },
            remainingCredits: newCredits
        })

    } catch (error: any) {
        console.error("Generation error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}
