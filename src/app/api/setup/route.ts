import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Raw SQL to create tables
const CREATE_TABLES_SQL = `
-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "avatar" TEXT,
  "bio" TEXT,
  "role" TEXT DEFAULT 'PARTICIPANT',
  "tier" TEXT DEFAULT 'B',
  "points" INTEGER DEFAULT 0,
  "whatsappId" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "lastLoginAt" TIMESTAMP,
  "pushToken" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Super Admin
INSERT INTO "User" (id, phone, name, role, tier, "isActive", "createdAt", "updatedAt")
VALUES ('super_admin_001', '+6281349924210', 'Super Admin', 'SUPER_ADMIN', 'S', true, NOW(), NOW())
ON CONFLICT (phone) DO UPDATE SET role = 'SUPER_ADMIN', tier = 'S';
`;

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not set',
    }, { status: 500 });
  }

  // Mask password in response
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  
  try {
    // Create connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });

    // Test connection
    const client = await pool.connect();
    
    // Create tables
    await client.query(CREATE_TABLES_SQL);
    
    // Check if Super Admin exists
    const result = await client.query('SELECT * FROM "User" WHERE phone = \'+6281349924210\'');
    
    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Database setup complete',
      databaseUrl: maskedUrl,
      superAdmin: result.rows[0] || null,
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: maskedUrl,
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
