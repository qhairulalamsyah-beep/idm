# Idol Meta Tournament - Production Deployment Guide

## 🚀 Quick Start Production

### Prerequisites
- Node.js 20+ or Bun
- PostgreSQL 15+ database
- (Optional) Docker & Docker Compose

### Step 1: Environment Setup

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your database credentials
nano .env.production
```

### Step 2: Database Setup

```bash
# Generate Prisma Client
bun run db:generate

# Run migrations
bun run db:migrate:prod

# Seed Super Admin
bun run db:seed
```

### Step 3: Build & Start

```bash
# Build for production
bun run build

# Start production server
bun run start
```

---

## 🐳 Docker Deployment

### Option A: Docker Compose (Recommended)

```bash
# Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# Start all services
bun run docker:up

# Check logs
docker-compose logs -f app
```

### Option B: Standalone Docker

```bash
# Build image
bun run docker:build

# Run container
bun run docker:run
```

---

## ☁️ Cloud Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Random 32+ char string
   - `NEXTAUTH_URL` - Your domain
4. Deploy!

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `bun install && bun run build`
4. Set start command: `bun run start`
5. Add PostgreSQL database
6. Set environment variables

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-postgres-url"
fly secrets set NEXTAUTH_SECRET="your-secret"
```

---

## 📊 Database Options

### 1. Vercel Postgres (Free tier available)
```
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
```

### 2. Supabase (Free tier available)
```
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

### 3. Neon (Free tier available)
```
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 4. Railway PostgreSQL
```
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

### 5. Self-hosted PostgreSQL
```
DATABASE_URL="postgresql://user:password@localhost:5432/idol_meta"
```

---

## 🔐 Super Admin Access

Default credentials:
- **Phone**: `+6281349924210` (or `081349924210`)
- **Password**: `tazevsta`

⚠️ **Change these in production!**

---

## 📁 Production Files Structure

```
├── .env.production       # Production environment variables
├── .env.production.example # Template
├── Dockerfile            # Docker build config
├── docker-compose.yml    # Multi-container setup
├── prisma/
│   └── schema.prisma     # Database schema (PostgreSQL)
├── scripts/
│   ├── seed-super-admin.ts
│   ├── build-production.sh
│   └── deploy-production.sh
└── .next/                # Production build output
    └── standalone/       # Standalone server
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate:prod` | Run production migrations |
| `bun run db:seed` | Seed Super Admin |
| `bun run db:studio` | Open Prisma Studio |
| `bun run docker:up` | Start with Docker Compose |
| `bun run docker:down` | Stop Docker containers |
| `bun run prod:deploy` | Full deployment script |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Secret for JWT signing (32+ chars) |
| `NEXTAUTH_URL` | ✅ | Your app URL |
| `NEXT_PUBLIC_APP_NAME` | ❌ | App name (default: "Idol Meta Tournament") |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public app URL |
| `MIDTRANS_SERVER_KEY` | ❌ | Midtrans payment gateway |
| `MIDTRANS_CLIENT_KEY` | ❌ | Midtrans client key |
| `XENDIT_SECRET_KEY` | ❌ | Xendit payment gateway |
| `XENDIT_PUBLIC_KEY` | ❌ | Xendit public key |

---

## 📈 Monitoring & Logs

```bash
# View server logs
tail -f server.log

# View Docker logs
docker-compose logs -f

# Check application health
curl http://localhost:3000/api/seed/demo
```

---

## 🆘 Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Solution**: Check DATABASE_URL and ensure PostgreSQL is running

### Prisma Client Error
```
Error: Prisma Client could not be generated
```
**Solution**: Run `bun run db:generate`

### Build Error
```
Error: Build failed
```
**Solution**: Clear cache and rebuild
```bash
rm -rf .next node_modules
bun install
bun run build
```

---

## 📞 Support

For issues or questions, check the documentation or contact the development team.

**Happy Gaming! 🎮**
