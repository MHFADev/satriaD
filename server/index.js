const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./utils/security');

// Load env vars
require('dotenv').config();

const PORT = process.env.PORT || 3001;

const app = express();

// Database connection (lazy + crash-safe for serverless)
let prisma;
let prismaInitError;
function getPrisma() {
  if (prisma) return prisma;
  if (prismaInitError) throw prismaInitError;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    return prisma;
  } catch (err) {
    prismaInitError = err;
    throw err;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// --- SECURITY MIDDLEWARE ---
// DISABLED for testing - will re-enable after fixing compatibility

// 1. Helmet for security headers
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// 2. Rate Limiting - DISABLED
// const generalLimiter = rateLimit({...});
// const loginLimiter = rateLimit({...});

// 3. XSS Protection
// app.use(xss());

// 4. CORS
app.use(cors());

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists (for local dev only)
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const p = getPrisma();
    const adminCount = await p.admin.count();
    res.json({ status: 'OK', dbConnected: true, adminCount, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'Error', dbConnected: false, error: error.message, timestamp: new Date().toISOString() });
  }
});

// Multer Config for temporary storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- AUTH ROUTES ---

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password });
  try {
    const p = getPrisma();
    // First check if any admin exists
    const adminCount = await p.admin.count();
    console.log('Total admin count:', adminCount);
    
    const admin = await p.admin.findUnique({ where: { username } });
    console.log('Admin found:', admin);
    if (!admin) {
      console.log('Admin not found for username:', username);
      return res.status(401).json({ message: 'Invalid credentials', debug: { adminCount } });
    }

    console.log('Comparing password...');
    console.log('Input password:', password);
    console.log('Stored hash:', admin.password);
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials', debug: { passwordMatch: false } });

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Middleware for Admin Auth
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

// --- PROJECT ROUTES ---

// Get All Projects
app.get('/api/projects', async (req, res) => {
  try {
    const p = getPrisma();
    const projects = await p.project.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Upload Project (Admin Only)
app.post('/api/projects', auth, upload.single('image'), async (req, res) => {
  const { title, category, description } = req.body;
  if (!req.file) return res.status(400).json({ message: 'Image is required' });

  try {
    const p = getPrisma();
    const filename = `project-${Date.now()}.webp`;
    const filepath = path.join(uploadDir, filename);

    // For Vercel, we'll return base64 or use a CDN
    let imageUrl;
    if (process.env.VERCEL === '1') {
      imageUrl = `data:image/webp;base64,${req.file.buffer.toString('base64')}`;
    } else {
      imageUrl = `/uploads/${filename}`;
      await sharp(req.file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
    }

    const project = await p.project.create({
      data: {
        title,
        category,
        description,
        imageUrl
      }
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading project' });
  }
});

// Delete Project (Admin Only)
app.delete('/api/projects/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const p = getPrisma();
    const project = await p.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Remove file (only for local development)
    if (process.env.NODE_ENV !== 'production') {
      const filepath = path.join(__dirname, project.imageUrl);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }

    await p.project.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// --- ORDER ROUTES ---

app.post('/api/orders', async (req, res) => {
  const { name, whatsapp, service, deadline, detail } = req.body;
  try {
    const p = getPrisma();
    const newOrder = await p.order.create({
      data: {
        name: encrypt(name),
        whatsapp: encrypt(whatsapp),
        service,
        deadline,
        detail: encrypt(detail)
      },
    });
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan pesanan.' });
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    const p = getPrisma();
    const orders = await p.order.findMany({ orderBy: { createdAt: 'desc' } });
    const decryptedOrders = orders.map(order => ({
      ...order,
      name: decrypt(order.name),
      whatsapp: decrypt(order.whatsapp),
      detail: decrypt(order.detail)
    }));
    res.json(decryptedOrders);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan.' });
  }
});

// --- SERVER START ---
// Only start server if running directly (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

