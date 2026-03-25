#!/bin/bash
# ===========================================
# Production Deployment Script
# ===========================================

set -e

echo "🚀 Idol Meta Tournament - Production Deployment"
echo "=============================================="

# Step 1: Check environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    echo "Please set DATABASE_URL in .env.production"
    exit 1
fi

# Step 2: Generate Prisma Client
echo "📦 Generating Prisma Client..."
bunx prisma generate

# Step 3: Run migrations
echo "🔄 Running database migrations..."
bunx prisma migrate deploy

# Step 4: Seed Super Admin
echo "👤 Seeding Super Admin..."
bun run scripts/seed-super-admin.ts

# Step 5: Build application
echo "🏗️  Building application..."
bun run build

# Step 6: Start server
echo "🌟 Starting production server..."
bun run start
