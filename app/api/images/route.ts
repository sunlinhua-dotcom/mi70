import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') // 'original' | 'result'

    if (!id || !type) {
        return new NextResponse('Missing params', { status: 400 })
    }

    try {
        const job = await prisma.generationJob.findUnique({
            where: { id },
            select: {
                originalData: type === 'original',
                resultData: type === 'result'
            }
        })

        if (!job) {
            return new NextResponse('Not found', { status: 404 })
        }

        // @ts-ignore
        const base64Data = type === 'original' ? job.originalData : job.resultData

        if (!base64Data) {
            return new NextResponse('No image data found', { status: 404 })
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64')

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (e) {
        console.error('Image fetch error:', e)
        return new NextResponse('Server Error', { status: 500 })
    }
}
