// Test R2 Connection
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')
require('dotenv').config()

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mi70-assets'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

console.log('🔍 R2 Configuration Check:')
console.log('  - Account ID:', R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing')
console.log('  - Access Key ID:', R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing')
console.log('  - Secret Key:', R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing')
console.log('  - Bucket Name:', R2_BUCKET_NAME)
console.log('  - Public URL:', R2_PUBLIC_URL)

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('\n❌ Missing R2 credentials!')
    process.exit(1)
}

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})

async function testR2() {
    console.log('\n📤 Testing R2 Upload...')

    try {
        // Create a test file
        const testContent = Buffer.from('Hello from MI70! Test at ' + new Date().toISOString())
        const testKey = `test/${Date.now()}.txt`

        // Upload
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain',
        }))

        console.log('✅ Upload successful!')
        console.log('   Key:', testKey)
        console.log('   Public URL:', `${R2_PUBLIC_URL}/${testKey}`)

        // List objects to verify
        console.log('\n📋 Listing bucket contents...')
        const listResult = await s3Client.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 5
        }))

        if (listResult.Contents && listResult.Contents.length > 0) {
            console.log('   Objects in bucket:')
            listResult.Contents.forEach(obj => {
                console.log(`   - ${obj.Key} (${obj.Size} bytes)`)
            })
        } else {
            console.log('   Bucket is empty (but connection works!)')
        }

        console.log('\n🎉 R2 Connection Test PASSED!')

    } catch (error) {
        console.error('\n❌ R2 Test FAILED:', error.message)
        process.exit(1)
    }
}

testR2()
