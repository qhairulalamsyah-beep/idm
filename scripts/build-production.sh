#!/bin/bash
# ===========================================
# Idol Meta Tournament - Production Build Script
# ===========================================

set -e

echo "🚀 Starting production build..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found!"
    echo "📋 Creating .env.production from template..."
    cp .env.production.example .env.production
    echo "📝 Please edit .env.production with your production values"
    echo "❌ Build aborted. Configure .env.production and run again."
    exit 1
fi

# Load production environment
export $(grep -v '^#' .env.production | xargs)

echo "📦 Installing dependencies..."
bun install --frozen-lockfile

echo "🔧 Generating Prisma Client..."
bunx prisma generate

echo "🏗️  Building Next.js application..."
bun run build

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Run database migrations: bunx prisma migrate deploy"
echo "3. Seed Super Admin: bun run scripts/seed-super-admin.ts"
echo "4. Start production server: bun run start"
