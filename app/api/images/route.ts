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

        let data = actualType === 'original' ? job.originalData : job.resultData

        if (!data) {
            return new NextResponse('No image data found', { status: 404 })
        }

        // Check for Composite Data (JSON)
        // If the stored data is a JSON string (used in Custom Shop for dual images), 
        // we extract the 'main' image to display as the "Original".
        if (data.trim().startsWith('{')) {
            try {
                const composite = JSON.parse(data)
                data = composite.main || ''
            } catch (e) {
                console.error("Failed to parse composite image data", e)
                return new NextResponse('Invalid Data', { status: 500 })
            }
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

            // Streaming Response: Pass the R2 stream directly to the client
            // This drastically reduces TTFB as we don't wait for the full download
            return new NextResponse(r2Res.body, {
                headers: {
                    'Content-Type': r2Res.headers.get('content-type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            })
        }

        // 如果是 Base64 数据，转换回 Buffer
        // 兼容性处理：如果有 data:image/...;base64, 前缀，去掉它
        const base64Content = data.includes('base64,') ? data.split('base64,')[1] : data
        const buffer = Buffer.from(base64Content, 'base64')

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
