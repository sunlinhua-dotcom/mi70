// scripts/test-db-connection.js
// Run with: node scripts/test-db-connection.js

const { PrismaClient } = require('@prisma/client');

async function main() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    const prisma = new PrismaClient();

    try {
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Connection successful!', result);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
