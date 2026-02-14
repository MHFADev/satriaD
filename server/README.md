# SatriaD Backend (PostgreSQL + Railway)

Backend ini dibuat menggunakan Express.js dan Prisma untuk menyimpan data pesanan dari landing page SatriaD ke database PostgreSQL.

## Cara Persiapan di Lokal

1. Masuk ke folder server:
   ```bash
   cd server
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Copy `.env.example` menjadi `.env` dan isi `DATABASE_URL` dengan koneksi database kamu:
   ```bash
   cp .env.example .env
   ```
4. Jalankan migrasi Prisma untuk membuat tabel di database:
   ```bash
   npx prisma db push
   ```
5. Jalankan server:
   ```bash
   node index.js
   ```

## Cara Deploy ke Railway

1. Buat project baru di Railway.
2. Tambahkan **Database PostgreSQL** ke project Railway kamu.
3. Hubungkan repositori GitHub kamu ke Railway.
4. Railway akan otomatis mendeteksi folder `server`. Pastikan kamu mengatur **Root Directory** ke `server` di settings Railway jika perlu.
5. Tambahkan **Environment Variable** di Railway:
   - `DATABASE_URL`: Ambil dari tab 'Variables' di layanan PostgreSQL Railway kamu.
   - `PORT`: 5000 (atau biarkan Railway mengaturnya sendiri).

## Struktur Database (Prisma)

Tabel `Order` memiliki kolom:
- `id`: Auto increment
- `name`: Nama pengirim
- `whatsapp`: Nomor WhatsApp
- `service`: Jenis layanan
- `deadline`: Tanggal deadline (opsional)
- `detail`: Detail pesanan
- `createdAt`: Waktu pesanan dibuat
