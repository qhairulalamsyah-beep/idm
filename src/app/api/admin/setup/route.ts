import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/setup - Check database connection and admin user
export async function GET() {
  try {
    console.log('=== Database Connection Test ===');

    // Test database connection
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');

    // Check if admin user exists
    const adminPhone = '+6281349924210';
    let admin = await db.user.findUnique({
      where: { phone: adminPhone },
    });

    if (!admin) {
      // Create admin user
      admin = await db.user.create({
        data: {
          phone: adminPhone,
          name: 'Tazos Admin',
          role: 'SUPER_ADMIN',
          tier: 'S',
        },
      });
      console.log('✅ Created admin user:', admin.id);
    } else if (admin.role !== 'SUPER_ADMIN') {
      // Update to SUPER_ADMIN
      admin = await db.user.update({
        where: { id: admin.id },
        data: { role: 'SUPER_ADMIN', tier: 'S', name: 'Tazos Admin' },
      });
      console.log('✅ Updated admin user:', admin.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Database connected and admin user ready',
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
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/setup - Force create/update admin user
export async function POST() {
  try {
    console.log('=== Force Create Admin User ===');

    const adminPhone = '+6281349924210';
    
    // Delete existing admin user if any
    await db.user.deleteMany({
      where: { phone: adminPhone },
    });

    // Create fresh admin user
    const admin = await db.user.create({
      data: {
        phone: adminPhone,
        name: 'Tazos Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
      },
    });

    console.log('✅ Created fresh admin user:', admin.id);

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
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
    });
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
