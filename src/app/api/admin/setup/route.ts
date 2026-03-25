import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/admin/setup - Check database and create admin
export async function GET() {
  const logs: string[] = [];
  
  try {
    logs.push('=== Starting Admin Setup ===');
    logs.push(`Time: ${new Date().toISOString()}`);
    logs.push(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    logs.push(`NODE_ENV: ${process.env.NODE_ENV}`);

    // Test database connection
    logs.push('Testing database connection...');
    try {
      const result = await db.$queryRaw`SELECT 1 as test`;
      logs.push(`✅ Database connected: ${JSON.stringify(result)}`);
    } catch (dbConnError) {
      logs.push(`❌ Database connection failed: ${dbConnError}`);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        logs,
        details: dbConnError instanceof Error ? dbConnError.message : 'Unknown',
      }, { status: 500 });
    }

    // Check/create admin user
    const adminPhone = '+6281349924210';
    logs.push(`Looking for admin with phone: ${adminPhone}`);
    
    let admin;
    try {
      admin = await db.user.findUnique({
        where: { phone: adminPhone },
      });
      logs.push(`Existing user: ${admin ? JSON.stringify({ id: admin.id, name: admin.name, role: admin.role }) : 'Not found'}`);
    } catch (findError) {
      logs.push(`❌ Error finding user: ${findError}`);
      return NextResponse.json({
        success: false,
        error: 'Failed to find user',
        logs,
        details: findError instanceof Error ? findError.message : 'Unknown',
      }, { status: 500 });
    }

    if (!admin) {
      logs.push('Creating new admin user...');
      try {
        admin = await db.user.create({
          data: {
            phone: adminPhone,
            name: 'Tazos Admin',
            role: 'SUPER_ADMIN',
            tier: 'S',
          },
        });
        logs.push(`✅ Created admin: ${JSON.stringify({ id: admin.id, name: admin.name, role: admin.role })}`);
      } catch (createError) {
        // Check if it's a table doesn't exist error
        const errorMsg = createError instanceof Error ? createError.message : '';
        if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
          logs.push(`❌ Table doesn't exist! Need to run prisma db push`);
          return NextResponse.json({
            success: false,
            error: 'Database tables not found. Please run: npx prisma db push',
            logs,
            details: errorMsg,
            needsMigration: true,
          }, { status: 500 });
        }
        logs.push(`❌ Error creating user: ${createError}`);
        return NextResponse.json({
          success: false,
          error: 'Failed to create admin user',
          logs,
          details: errorMsg,
        }, { status: 500 });
      }
    } else if (admin.role !== 'SUPER_ADMIN') {
      logs.push('Updating user to SUPER_ADMIN...');
      try {
        admin = await db.user.update({
          where: { id: admin.id },
          data: { role: 'SUPER_ADMIN', tier: 'S', name: 'Tazos Admin' },
        });
        logs.push(`✅ Updated admin: ${JSON.stringify({ id: admin.id, name: admin.name, role: admin.role })}`);
      } catch (updateError) {
        logs.push(`❌ Error updating user: ${updateError}`);
        return NextResponse.json({
          success: false,
          error: 'Failed to update admin user',
          logs,
          details: updateError instanceof Error ? updateError.message : 'Unknown',
        }, { status: 500 });
      }
    }

    logs.push('=== Admin Setup Complete ===');

    return NextResponse.json({
      success: true,
      message: 'Admin ready! Now try to login.',
      admin: {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
      },
      loginCredentials: {
        username: 'tazos',
        password: 'tazevsta',
      },
      logs,
    });
  } catch (error) {
    logs.push(`❌ Unexpected error: ${error}`);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      logs,
      details: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 });
  }
}

// POST - Force recreate admin
export async function POST() {
  const logs: string[] = [];
  
  try {
    logs.push('=== Force Recreate Admin ===');
    
    const adminPhone = '+6281349924210';
    
    // Delete existing
    logs.push('Deleting existing admin...');
    try {
      const deleted = await db.user.deleteMany({
        where: { phone: adminPhone },
      });
      logs.push(`Deleted ${deleted.count} users`);
    } catch (delError) {
      logs.push(`Delete error (might be ok): ${delError}`);
    }

    // Create fresh
    logs.push('Creating fresh admin...');
    const admin = await db.user.create({
      data: {
        phone: adminPhone,
        name: 'Tazos Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
      },
    });
    logs.push(`✅ Created: ${JSON.stringify({ id: admin.id, name: admin.name, role: admin.role })}`);

    return NextResponse.json({
      success: true,
      message: 'Admin recreated!',
      admin: {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
      },
      loginCredentials: {
        username: 'tazos',
        password: 'tazevsta',
      },
      logs,
    });
  } catch (error) {
    logs.push(`❌ Error: ${error}`);
    return NextResponse.json({
      success: false,
      error: 'Failed to recreate admin',
      logs,
      details: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 });
  }
}
