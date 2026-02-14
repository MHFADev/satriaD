const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  const username = 'satriaD';
  const password = 'Satria@studio12';
  
  console.log('Creating/updating admin:', username);
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const admin = await prisma.admin.upsert({
      where: { username },
      update: { password: hashedPassword },
      create: {
        username,
        password: hashedPassword,
      },
    });

    console.log('✅ Admin account created/updated:');
    console.log(`Username: ${admin.username}`);
    console.log(`ID: ${admin.id}`);
    console.log('Password: Satria@studio12 (hashed)');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
