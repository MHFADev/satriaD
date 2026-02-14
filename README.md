# Satria Portfolio - Deployment Guide

## Project Structure
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Express.js + Prisma + PostgreSQL
- **Deployment**: Vercel (Serverless Functions)

## Environment Variables

### Required Environment Variables for Vercel:
1. `DATABASE_URL` - PostgreSQL connection string
2. `JWT_SECRET` - JWT secret key (minimum 32 characters)
3. `ENCRYPTION_KEY` - Encryption key (exactly 32 characters)
4. `NODE_ENV` - Set to `production`
5. `PORT` - Set to `5000`

## Setup Instructions

### 1. Database Setup
- Use PostgreSQL (Railway, Supabase, or PlanetScale recommended)
- Copy the connection string to `DATABASE_URL`

### 2. Environment Variables
In Vercel dashboard, add these environment variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_secure_jwt_secret_key_minimum_32_chars
ENCRYPTION_KEY=your_exactly_32_character_encryption_key
NODE_ENV=production
PORT=5000
```

### 3. Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Features
- ✅ Project portfolio display
- ✅ Admin authentication (JWT)
- ✅ Project management (CRUD)
- ✅ Order system with encryption
- ✅ Image upload and optimization
- ✅ Responsive design
- ✅ Security middleware (Helmet, Rate Limiting, XSS Protection)

## API Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (admin only)

## Development
```bash
# Install dependencies
npm install
cd server && npm install

# Start development servers
npm run dev  # Frontend (port 5173)
cd server && npm start  # Backend (port 5000)
```

## Production
The app is configured for Vercel serverless deployment with automatic builds and function handling.
