const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const username = 'sbrain'
    const password = 'sbrain888' // Default password if creating

    const existingUser = await prisma.user.findUnique({
        where: { username }
    })

    if (existingUser) {
        console.log(`User '${username}' found. Updating to ADMIN role...`)
        await prisma.user.update({
            where: { username },
            data: {
                role: 'ADMIN',
                credits: 999999 // Cosmetic: give lots of credits visually
            }
        })
        console.log(`✅ User '${username}' is now an ADMIN (Super Account).`)
    } else {
        console.log(`User '${username}' not found. Creating new ADMIN account...`)
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'ADMIN',
                credits: 999999
            }
        })
        console.log(`✅ Created Super Account:`)
        console.log(`   Username: ${username}`)
        console.log(`   Password: ${password}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
