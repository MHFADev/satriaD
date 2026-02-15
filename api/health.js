import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

let prisma;
if (DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } catch (err) {
    console.error('Prisma init error:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (!prisma) {
      return res.status(500).json({ 
        status: 'Error', 
        dbConnected: false, 
        error: 'Database not initialized',
        hasDbUrl: !!DATABASE_URL,
        timestamp: new Date().toISOString()
      });
    }

    const adminCount = await prisma.admin.count();
    const projectCount = await prisma.project.count();
    const orderCount = await prisma.order.count();

    res.json({ 
      status: 'OK', 
      dbConnected: true, 
      adminCount, 
      projectCount, 
      orderCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      dbConnected: false, 
      error: error.message, 
      timestamp: new Date().toISOString()
    });
  }
}
