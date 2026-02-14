const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'satriastudio12_secret_key_32chars_';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    const decrypted = orders.map(order => ({
      ...order,
      name: decrypt(order.name),
      whatsapp: decrypt(order.whatsapp),
      detail: decrypt(order.detail)
    }));
    res.json(decrypted);
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
