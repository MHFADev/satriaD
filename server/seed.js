const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not found. Skipping seed.');
    return;
  }
  
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

    console.log('✅ Admin 1 created/updated:', admin1.username);
    
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

    console.log('✅ Admin 2 created/updated:', admin2.username);
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
