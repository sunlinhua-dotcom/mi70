
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({ where: { username: 'sbrain' } })
    if (!user) {
        console.log('User sbrain not found')
        return
    }

    const jobs = await prisma.generationJob.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log(`Found ${jobs.length} jobs for sbrain`)

    for (const job of jobs) {
        console.log('--------------------------------------------------')
        console.log(`Job ID: ${job.id}`)
        console.log(`Status: ${job.status}`)
        console.log(`Original Data Type: ${job.originalData ? (job.originalData.startsWith('http') ? 'URL' : 'Base64') : 'NULL'}`)
        if (job.originalData && job.originalData.startsWith('http')) {
            console.log(`Original URL: ${job.originalData}`)
        } else if (job.originalData) {
            console.log(`Original Base64 Length: ${job.originalData.length}`)
            console.log(`Original Base64 Start: ${job.originalData.substring(0, 50)}...`)
        }

        console.log(`Result Data Type: ${job.resultData ? (job.resultData.startsWith('http') ? 'URL' : 'Base64') : 'NULL'}`)
        if (job.resultData && job.resultData.startsWith('http')) {
            console.log(`Result URL: ${job.resultData}`)
        } else if (job.resultData) {
            console.log(`Result Base64 Length: ${job.resultData.length}`)
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
