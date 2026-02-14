const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const multer = require('multer');
const crypto = require('crypto');

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'satriastudio12_secret_key_32chars_';

// Prisma setup
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Encryption functions
function encrypt(text) {
  if (!text) return text;
  const key = ENCRYPTION_KEY;
  const encoded = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return Buffer.from(result).toString('base64');
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

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Routes
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data project.' });
  }
});

app.get('/orders', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    const decrypted = orders.map(order => ({
      ...order,
      name: decrypt(order.name),
      whatsapp: decrypt(order.whatsapp),
      detail: decrypt(order.detail)
    }));
    res.json(decrypted);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pesanan.' });
  }
});

// Export for Vercel
module.exports = app;
