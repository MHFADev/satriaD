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
  
  // Admin 1
  const username1 = 'satriaD';
  const password1 = 'Satria@12';
  
  console.log('Creating/updating admin:', username1);
  
  try {
    const hashedPassword1 = await bcrypt.hash(password1, 10);
    console.log('Password hashed successfully');

    const admin1 = await prisma.admin.upsert({
      where: { username: username1 },
      update: { password: hashedPassword1 },
      create: {
        username: username1,
        password: hashedPassword1,
      },
    });

    console.log('✅ Admin 1 created/updated:');
    console.log(`Username: ${admin1.username}`);
    console.log(`ID: ${admin1.id}`);
    console.log('Password: Satria@12 (hashed)');
    
    // Admin 2
    const username2 = 'satria12';
    const password2 = 'satria09';
    
    console.log('Creating/updating admin:', username2);
    
    const hashedPassword2 = await bcrypt.hash(password2, 10);
    
    const admin2 = await prisma.admin.upsert({
      where: { username: username2 },
      update: { password: hashedPassword2 },
      create: {
        username: username2,
        password: hashedPassword2,
      },
    });

    console.log('✅ Admin 2 created/updated:');
    console.log(`Username: ${admin2.username}`);
    console.log(`ID: ${admin2.id}`);
    console.log('Password: satria09 (hashed)');
    
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
