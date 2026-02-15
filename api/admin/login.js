const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed', method: req.method });
  }

  if (!prisma) {
    return res.status(500).json({ message: 'Database not initialized', hasDbUrl: !!DATABASE_URL });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
