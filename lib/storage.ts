
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// Initialize S3 Client (Cloudflare R2 Compatibility)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mi70-assets'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

const s3Client = (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    })
    : null

/**
 * Upload a file buffer to Cloudflare R2
 */
export async function uploadToR2(
    fileBuffer: Buffer,
    contentType: string = 'image/jpeg',
    folder: string = 'uploads'
): Promise<string | null> {
    if (!s3Client || !R2_PUBLIC_URL) {
        if (!s3Client) console.warn('[R2] Client not initialized.')
        if (!R2_PUBLIC_URL) console.warn('[R2] Public URL missing.')
        return null
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `${folder}/${dateStr}/${uuidv4()}.jpg`

    try {
        console.log(`[R2] Uploading: ${fileName}`)
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        }))

        const url = `${R2_PUBLIC_URL}/${fileName}`
        console.log(`[R2] Success: ${url}`)
        return url
    } catch (error) {
        console.error('[R2] Upload failed:', error)
        return null
    }
}

/**
 * Upload image with automatic thumbnail generation
 * @returns Object containing both original and thumbnail URLs
 */
export async function uploadWithThumbnail(
    fileBuffer: Buffer,
    folder: string = 'uploads',
    highQuality: boolean = false
): Promise<{ url: string | null, thumbUrl: string | null }> {
    if (!s3Client || !R2_PUBLIC_URL) {
        return { url: null, thumbUrl: null }
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const id = uuidv4()
    const originalKey = `${folder}/${dateStr}/${id}.jpg`
    const thumbKey = `${folder}/${dateStr}/${id}_thumb.jpg`

    try {
        // Generate thumbnail (300px width, 60% quality)
        const thumbBuffer = await sharp(fileBuffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 60 })
            .toBuffer()

        // Prepare main buffer (Original or HQ)
        let mainBuffer = fileBuffer
        if (highQuality) {
            // Re-process with high quality JPEG to ensure consistency and precision
            mainBuffer = await sharp(fileBuffer)
                .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
                .toBuffer()
        }

        // Upload both in parallel
        await Promise.all([
            s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: originalKey,
                Body: mainBuffer,
                ContentType: 'image/jpeg',
            })),
            s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: thumbKey,
                Body: thumbBuffer,
                ContentType: 'image/jpeg',
            }))
        ])

        return {
            url: `${R2_PUBLIC_URL}/${originalKey}`,
            thumbUrl: `${R2_PUBLIC_URL}/${thumbKey}`
        }
    } catch (error) {
        console.error('[R2] Upload with thumbnail failed:', error)
        return { url: null, thumbUrl: null }
    }
}


/**
 * Get a file directly from R2 using S3 API (bypasses blocked r2.dev domain)
 * @param r2Url - The R2 public URL (e.g., https://pub-xxx.r2.dev/results/2026-02-14/xxx.jpg)
 * @returns Buffer of the file data, or null if failed
 */
export async function getFromR2(r2Url: string): Promise<Buffer | null> {
    if (!s3Client || !R2_PUBLIC_URL) {
        console.warn('[R2] Cannot read: client not initialized')
        return null
    }

    try {
        // Extract the key from the URL: remove the R2_PUBLIC_URL prefix
        const key = r2Url.replace(`${R2_PUBLIC_URL}/`, '')
        console.log(`[R2] Reading via S3 API: ${key}`)

        const response = await s3Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }))

        if (!response.Body) {
            console.error('[R2] Empty response body')
            return null
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        const stream = response.Body as AsyncIterable<Uint8Array>
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        return Buffer.concat(chunks)

    } catch (error) {
        console.error('[R2] GetObject failed:', error)
        return null
    }
}
