
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

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
 * @param fileBuffer The file content as Buffer
 * @param contentType MIME type (e.g. image/jpeg)
 * @param folder Optional folder path (default: 'uploads')
 * @returns The public URL of the uploaded file, or null if upload failed or not configured
 */
export async function uploadToR2(
    fileBuffer: Buffer,
    contentType: string = 'image/jpeg',
    folder: string = 'uploads'
): Promise<string | null> {
    if (!s3Client || !R2_PUBLIC_URL) {
        // Log only once per server start ideally, but here just log warning
        if (!s3Client) console.warn('[R2] Client not initialized. Check ACCOUNT_ID/ACCESS_KEY/SECRET.')
        if (!R2_PUBLIC_URL) console.warn('[R2] Public URL missing. Skipping upload.')
        return null
    }

    // Generate path: folder/YYYY-MM-DD/uuid.jpg
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `${folder}/${dateStr}/${uuidv4()}.jpg`

    try {
        console.log(`[R2] Attempting upload: ${fileName} to bucket ${R2_BUCKET_NAME}`)
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        }))

        // Return the public URL
        const url = `${R2_PUBLIC_URL}/${fileName}`
        console.log(`[R2] Upload success: ${url}`)
        return url
    } catch (error) {
        console.error('[R2] Upload CRITICAL FAILURE:', error)
        // detailed error for debugging
        if (error instanceof Error) {
            console.error('[R2] Message:', error.message)
            console.error('[R2] Stack:', error.stack)
        }
        return null
    }
}
