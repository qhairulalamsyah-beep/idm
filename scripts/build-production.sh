#!/bin/bash

# Build script for Vercel deployment
# Swaps Prisma schema to PostgreSQL for production

echo "🚀 Starting production build..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ] || [ -n "$VERCEL" ]; then
  echo "📦 Production build detected - using PostgreSQL schema"
  
  # Backup SQLite schema
  cp prisma/schema.prisma prisma/schema.sqlite.bak
  
  # Copy PostgreSQL schema
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
  
  echo "✅ Switched to PostgreSQL schema"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bunx prisma generate

# Push schema to database (creates tables if needed)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgres* ]]; then
  echo "📊 Pushing schema to PostgreSQL database..."
  bunx prisma db push --accept-data-loss || echo "⚠️ db push failed, continuing..."
fi

# Build Next.js
echo "🏗️ Building Next.js application..."
bun next build

echo "✅ Build completed!"
