import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateImage } from "@/lib/gemini"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60 // Allow longer timeout for generation loops

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const files = formData.getAll('files') as File[]
        const style = formData.get('style') as string

        if (!files || files.length === 0 || !style) {
            return NextResponse.json({ error: "Missing files or style" }, { status: 400 })
        }

        // Check credits
        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isSuperUser = user.username === 'sbrain' || user.role === 'ADMIN'

        if (!isSuperUser && user.credits < files.length) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        const results: any[] = []
        const generatedDir = path.join(process.cwd(), 'public', 'generated-images')
        try {
            await mkdir(generatedDir, { recursive: true })
        } catch (e) {
            // ignore if exists
        }

        for (const file of files) {
            // 1. Convert input file to base64
            const buffer = Buffer.from(await file.arrayBuffer())
            const base64Input = buffer.toString('base64')

            // 2. Call Gemini
            // Note: Sequential execution to avoid rate limits or overwhelming the proxy, 
            // but parallel (Promise.all) is faster. For safety and credit atomic-ness, sequential is safer for now.
            const generatedBase64 = await generateImage(base64Input, style)

            // 3. Save to disk
            const fileName = `${uuidv4()}.jpg`
            const filePath = path.join(generatedDir, fileName)
            const imageBuffer = Buffer.from(generatedBase64, 'base64')
            await writeFile(filePath, imageBuffer)

            const publicUrl = `/generated-images/${fileName}`

            // 4. Record in DB
            const imageRecord = await prisma.image.create({
                data: {
                    userId: user.id,
                    originalUrl: "placeholder_original_upload",
                    generatedUrl: publicUrl,
                    style: style,
                    status: "COMPLETED"
                }
            })

            results.push({ id: imageRecord.id, url: publicUrl })
        }

        // Deduct credits ONLY if not super user
        if (!isSuperUser) {
            await prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: files.length } }
            })
        }

        return NextResponse.json({ success: true, images: results, remainingCredits: user.credits - files.length })

    } catch (error: any) {
        console.error("Generation error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}
