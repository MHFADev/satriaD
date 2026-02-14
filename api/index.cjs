const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'satriastudio12_secret_key_32chars_';

console.log('DATABASE_URL exists:', !!DATABASE_URL);

let prisma;
try {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.error('Prisma init error:', err);
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url;
  console.log('Request:', req.method, url);

  try {
    // POST /api/admin/login
    if (url === '/api/admin/login' && req.method === 'POST') {
      const { username, password } = req.body;
      
      if (!prisma) {
        return res.status(500).json({ message: 'Database not initialized', debug: { dbUrlExists: !!DATABASE_URL } });
      }
      
      const admin = await prisma.admin.findUnique({ where: { username } });
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, token });
    }

    // GET /api/projects
    if (url === '/api/projects' && req.method === 'GET') {
      const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(projects);
    }

    // GET /api/orders
    if (url === '/api/orders' && req.method === 'GET') {
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
      return res.json(decrypted);
    }

    // 404 for other routes
    res.status(404).json({ message: 'Not found', url, method: req.method });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
