import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { getFromR2 } from "@/lib/storage"

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
        if (data && isThumb && data.startsWith('http') && data.endsWith('.jpg') && !data.includes('_thumb.jpg')) {
            data = data.replace('.jpg', '_thumb.jpg')
        }

        // 如果是 R2 URL，使用 S3 SDK 直接读取（绕过 r2.dev 被墙问题）
        if (data && data.startsWith('http')) {
            // 先尝试直接读取（含缩略图处理）
            let buffer = await getFromR2(data)

            // 如果缩略图不存在，回退到原图
            if (!buffer && isThumb) {
                console.log('[Images] Thumb not found, falling back to original')
                buffer = await getFromR2(data.replace('_thumb.jpg', '.jpg'))
            }

            if (buffer) {
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': 'image/jpeg',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                        'CDN-Cache-Control': 'public, max-age=31536000, immutable'
                    }
                })
            }

            return new NextResponse('Failed to read from R2', { status: 502 })
        }

        // 如果是 Base64 数据，转换回 Buffer
        // 兼容性处理：如果有 data:image/...;base64, 前缀，去掉它
        // Use non-null assertion since we checked for nullity at the start
        const safeData = data!
        const base64Content = safeData.includes('base64,') ? safeData.split('base64,')[1] : safeData
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
