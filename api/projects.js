import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs/promises';
import sharp from 'sharp';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'satriad_jwt_secret_fallback_2026';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!prisma) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  try {
    if (req.method === 'GET') {
      const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(projects);
    }

    if (req.method === 'POST') {
      const token = req.headers['authorization'];
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      try {
        jwt.verify(token.split(' ')[1], JWT_SECRET);
      } catch {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });
      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, f, fl) => {
          if (err) return reject(err);
          resolve({ fields: f, files: fl });
        });
      });

      const title = String(fields.title || '').trim();
      const category = String(fields.category || '').trim();
      const description = String(fields.description || '').trim();
      const image = files.image;

      if (!title || !category) {
        return res.status(400).json({ message: 'title and category are required' });
      }
      if (!image) {
        return res.status(400).json({ message: 'image is required' });
      }

      const imagePath = Array.isArray(image) ? image[0]?.filepath : image.filepath;
      const imageBuffer = await fs.readFile(imagePath);
      const webpBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const imageUrl = `data:image/webp;base64,${webpBuffer.toString('base64')}`;

      const project = await prisma.project.create({
        data: {
          title,
          category,
          description,
          imageUrl,
        },
      });

      return res.status(201).json({ success: true, data: project });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Projects error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data project.' });
  }
}
