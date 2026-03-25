# Idol Meta Tournament - Vercel Deployment Guide

## 🚀 Deploy ke Vercel (Option 1)

### Step 1: Persiapan GitHub

```bash
# Initialize git jika belum
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Push ke GitHub
git remote add origin https://github.com/YOUR_USERNAME/idol-meta-tournament.git
git push -u origin main
```

### Step 2: Setup Database PostgreSQL

Pilih salah satu:

#### A. Vercel Postgres (Recommended)
1. Di Vercel Dashboard, buat project baru
2. Pilih "Storage" > "Create Database" > "Postgres"
3. Copy connection string

#### B. Supabase (Free 500MB)
1. Buat akun di https://supabase.com
2. Buat project baru
3. Settings > Database > Connection string > JDBC
4. Copy connection string

#### C. Neon (Free 512MB)
1. Buat akun di https://neon.tech
2. Buat project baru
3. Copy connection string

### Step 3: Deploy ke Vercel

1. Buka https://vercel.com
2. Klik "New Project"
3. Import dari GitHub
4. Pilih repository `idol-meta-tournament`
5. Framework Preset: **Next.js** (auto-detected)
6. Configure Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (dari Step 2) |
| `NEXTAUTH_SECRET` | Generate random 32+ char string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Idol Meta Tournament` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

7. Klik "Deploy"
8. Tunggu build selesai (±2-3 menit)

### Step 4: Seed Super Admin

Setelah deploy berhasil:

1. Buka terminal di Vercel dashboard atau gunakan Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run seed command
vercel env pull .env.local
bun run db:seed
```

Atau gunakan API endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/seed/super-admin \
  -H "Content-Type: application/json" \
  -d '{"phone": "+6281349924210", "password": "tazevsta", "name": "Super Admin"}'
```

### Step 5: Verifikasi

1. Buka `https://your-app.vercel.app`
2. Login sebagai Super Admin:
   - **Phone**: `+6281349924210` atau `081349924210`
   - **Password**: `tazevsta`

---

## 🔧 Environment Variables Lengkap

```env
# REQUIRED
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# APP CONFIG
NEXT_PUBLIC_APP_NAME="Idol Meta Tournament"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# OPTIONAL - Payment Gateway
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"

# OPTIONAL - Xendit
XENDIT_SECRET_KEY="xnd_development_xxxxx"
XENDIT_PUBLIC_KEY="xnd_public_development_xxxxx"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 📱 Fitur Aplikasi

- ✅ Tournament Management (Single/Double Elimination, Round Robin, Swiss)
- ✅ Real-time Bracket Updates
- ✅ Player Registration & Approval
- ✅ Team Management
- ✅ Prize Pool & Saweran
- ✅ Push Notifications
- ✅ Mobile-First Design
- ✅ Dark/Light Theme

---

## 🔐 Default Credentials

| Role | Phone | Password |
|------|-------|----------|
| Super Admin | +6281349924210 | tazevsta |

⚠️ **Ganti password setelah deploy pertama!**

---

## 🆘 Troubleshooting

### Build Error: Prisma Client
```
Error: Prisma Client could not be generated
```
**Solution**: Ensure `DATABASE_URL` is set in Vercel environment variables

### Database Connection Error
```
Error: Can't reach database server
```
**Solution**:
1. Check DATABASE_URL format
2. Ensure database allows external connections
3. For Supabase: Enable "Connection Pooling"

### Login Not Working
**Solution**:
1. Clear browser cache
2. Check if Super Admin exists via API:
   ```
   GET /api/seed/super-admin
   ```

---

## 📊 Vercel Dashboard

Monitor aplikasi di Vercel Dashboard:
- **Deployments**: History deploy
- **Analytics**: Traffic & performance
- **Logs**: Runtime errors
- **Storage**: Database management

---

## 🎉 Selesai!

Aplikasi Idol Meta Tournament sudah live di Vercel!

URL: `https://your-app.vercel.app`
