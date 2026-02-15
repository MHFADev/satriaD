import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'satriastudio12_secret_key_32chars_';

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

function decrypt(text) {
  if (!text) return text;
  try {
    const key = ENCRYPTION_KEY;
    const decoded = Buffer.from(text, 'base64');
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return text;
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

  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    jwt.verify(token.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }

  if (!prisma) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    const decrypted = orders.map(order => ({
      ...order,
      name: decrypt(order.name),
      whatsapp: decrypt(order.whatsapp),
      detail: decrypt(order.detail)
    }));
    return res.status(200).json(decrypted);
  } catch (error) {
    console.error('Orders error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pesanan.' });
  }
}
