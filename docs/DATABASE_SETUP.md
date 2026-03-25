# Database Setup Guide for Vercel Deployment

Panduan lengkap untuk setup PostgreSQL database menggunakan **Supabase** atau **Neon** untuk deployment ke Vercel.

---

## 🎯 Option 1: Supabase (Recommended)

Supabase adalah pilihan terbaik untuk project ini karena:
- ✅ Free tier generous (500MB database)
- ✅ Dashboard yang user-friendly
- ✅ Connection pooling built-in
- ✅ Auto-generated API (bonus)

### Step 1: Buat Akun Supabase

1. Kunjungi: https://supabase.com
2. Klik **"Start your project"**
3. Sign up dengan GitHub atau Email

### Step 2: Buat Project Baru

1. Klik **"New Project"**
2. Isi form:
   - **Name**: `idol-meta-tournament`
   - **Database Password**: (buat password kuat, simpan baik-baik!)
   - **Region**: `Southeast Asia (Singapore)` - terdekat dengan Indonesia
   - **Plan**: Free
3. Klik **"Create new project"**
4. Tunggu ± 2 menit sampai project selesai dibuat

### Step 3: Dapatkan Connection Strings

1. Di dashboard Supabase,2. Buka **Project Settings** (icon gear di sidebar kiri)
3. Pilih **Database**
4. Scroll ke bagian **Connection string**
5. Copy kedua URL:

#### Connection Pooler (untuk Vercel / Production):
```
postgres://postgres.[REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Direct Connection (untuk migrations):
```
postgres://postgres.[REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

> **PENTING**: Ganti `[REF]` dengan Project Reference ID Anda (ada di Project Settings > General)

---

## 🎯 Option 2: Neon

Neon adalah alternative yang bagus karena:
- ✅ Free tier (3GB storage)
- ✅ Serverless PostgreSQL
- ✅ Auto-scaling
- ✅ Branching feature

### Step 1: Buat Akun Neon

1. Kunjungi: https://neon.tech
2. Klik **"Sign up"**
3. Sign up dengan GitHub, Google, atau Email

### Step 2: Buat Project Baru

1. Klik **"Create a project"**
2. Isi form:
   - **Name**: `idol-meta-tournament`
   - **Region**: `AWS Asia Pacific (Singapore)` - terdekat dengan Indonesia
3. Klik **"Create project"**

### Step 3: Dapatkan Connection Strings

1. Di dashboard Neon
2. Buka **Connection Details**
3. Copy **Connection string**:
```
postgresql://[username]:[password]@[endpoint].neon.tech/[database]?sslmode=require
```

---

## 🚀 Deploy ke Vercel

### Step 1: Push ke GitHub

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua files
git add .

# Commit
git commit -m "Initial commit - Idol Meta Tournament Platform"

# Buat branch main
git branch -M main

# Tambahkan remote (ganti USERNAME/REPO)
git remote add origin https://github.com/USERNAME/idol-meta-tournament.git

# Push ke GitHub
git push -u origin main
```

### Step 2: Deploy di Vercel

1. Kunjungi: https://vercel.com
2. Klik **"Add New Project"**
3. Import dari GitHub (`idol-meta-tournament`)
4. Klik **"Import"**

### Step 3: Set Environment Variables

Di Vercel dashboard, buka **Settings** > **Environment Variables**, tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Connection string dengan pooling (port 6543 untuk Supabase atau dengan `?sslmode=require` untuk Neon) |
| `DIRECT_DATABASE_URL` | Direct connection string (port 5432 untuk Supabase) |

> **Contoh Supabase:**
> - `DATABASE_URL`: `postgres://postgres.abc123:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
> - `DIRECT_DATABASE_URL`: `postgres://postgres.abc123:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

### Step 4: Deploy

1. Klik **"Deploy"**
2. Tunggu sampai selesai
3. Buka URL deployment

---

## 🔄 Post-Deployment

### 1. Run Migrations

Database schema akan otomatis dibuat oleh Prisma saat pertama kali deploy. Jika tidak, gunakan:

```bash
# Install Prisma CLI locally
bun add -g prisma

# Push schema ke database
bun run db:push
```

Atau akses endpoint seed untuk membuat data demo:

```
https://your-app.vercel.app/api/seed/demo
```

### 2. Create Super Admin

Setelah deploy, buat Super Admin dengan mengakses:
```
https://your-app.vercel.app/api/seed/demo
```

Kemudian login dengan:
- **Phone**: `081349924210` atau `+6281349924210`
- **Password**: `tazevsta`

---

## 🔧 Troubleshooting

### Error: "Can't reach database server"
- Pastikan IP Vercel tidak di-block
- Supabase: Settings > Database > Connection Pooling > enable
- Neon: Pastikan connection string benar

### Error: "Connection pool exhausted"
- Gunakan connection pooler (port 6543 untuk Supabase)
- Tambahkan `?pgbouncer=true` di akhir URL

### Error: "SSL connection required"
- Tambahkan `?sslmode=require` di connection string

### Error: "Prisma Client not generated"
- Redeploy dengan mengosongkan cache Vercel

---

## 📊 Database Schema Overview

Database memiliki tables berikut:

| Table | Description |
|-------|-------------|
| **User** | User accounts & profiles |
| **Tournament** | Tournament management |
| **Registration** | Participant registrations |
| **Team** | Team formation |
| **Bracket** | Tournament brackets |
| **Match** | Match scheduling & results |
| **Club** | Gaming clubs |
| **Donation** | Platform donations |
| **Saweran** | Prize pool contributions |
| **Notification** | User notifications |

---

## 📞 Support

Jika ada masalah:
1. Cek Vercel deployment logs
2. Cek database logs di Supabase/Neon dashboard
3. Pastikan environment variables benar
4. Cek apakah IP Vercel di-whitelist
