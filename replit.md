# SatriAD Portfolio

## Overview
A portfolio website for SatriAD creative services. Built with React (Vite) frontend and Express.js backend with PostgreSQL database via Prisma ORM.

## Project Architecture
- **Frontend**: React 18 + Vite, TailwindCSS, Framer Motion, served on port 5000
- **Backend**: Express.js server on port 3001, proxied via Vite
- **Database**: PostgreSQL with Prisma ORM (v7) - models: Admin, Project, Order
- **Auth**: JWT-based admin authentication

## Structure
```
├── src/              # React frontend source
├── server/           # Express.js backend
│   ├── index.js      # Main server entry
│   ├── prisma/       # Prisma schema
│   ├── utils/        # Security utilities (encryption)
│   └── uploads/      # Local file uploads
├── public/           # Static assets
├── vite.config.ts    # Vite config (port 5000, proxy to :3001)
└── index.html        # Entry HTML
```

## Workflow
- `App Server`: Runs both Vite dev server (port 5000) and Express backend (port 3001) via concurrently

## Recent Changes
- 2026-02-14: Imported project to Replit, installed dependencies, configured database, set up workflow

## User Preferences
- Indonesian language UI (portfolio site)
