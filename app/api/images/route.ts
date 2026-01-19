import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') // 'original' | 'result' | 'thumb'

    if (!id || !type) {
        return new NextResponse('Missing params', { status: 400 })
    }

    const isThumb = type === 'thumb'
    const actualType = isThumb ? 'original' : type

    try {
        const job = await prisma.generationJob.findUnique({
            where: { id },
            select: {
                originalData: actualType === 'original',
                resultData: actualType === 'result'
            }
        })

        if (!job) {
            return new NextResponse('Not found', { status: 404 })
        }

        // @ts-expect-error - dynamic field access
        let data = actualType === 'original' ? job.originalData : job.resultData

        if (!data) {
            return new NextResponse('No image data found', { status: 404 })
        }

        // Handle Thumbnail request for R2 URLs
        if (isThumb && data.startsWith('http') && data.endsWith('.jpg') && !data.includes('_thumb.jpg')) {
            data = data.replace('.jpg', '_thumb.jpg')
        }

        // 如果已经是 URL (R2 存储)，代理转发而不是重定向 (解决 r2.dev 该死的墙问题)
        if (data.startsWith('http')) {
            const r2Res = await fetch(data)
            if (!r2Res.ok) {
                // If thumb failed, try fallback to original
                if (isThumb) {
                    const fallbackRes = await fetch(data.replace('_thumb.jpg', '.jpg'))
                    if (fallbackRes.ok) {
                        const buffer = Buffer.from(await fallbackRes.arrayBuffer())
                        return new NextResponse(buffer, {
                            headers: {
                                'Content-Type': 'image/jpeg',
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        })
                    }
                }
                throw new Error('Failed to fetch from R2')
            }

            const arrayBuffer = await r2Res.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': r2Res.headers.get('content-type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            })
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(data, 'base64')

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
