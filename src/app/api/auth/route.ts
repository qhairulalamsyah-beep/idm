import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/auth/send-otp - Send OTP via WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Check if user exists
    let user = await db.user.findUnique({
      where: { phone },
    });

    // Store OTP
    await db.oTPCode.create({
      data: {
        phone,
        code: otp,
        expiresAt,
        userId: user?.id,
      },
    });

    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      debug: { otp },
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/verify-otp - Verify OTP and login
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    const otpRecord = await db.oTPCode.findFirst({
      where: {
        phone,
        code: otp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    await db.oTPCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    let user = await db.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          name: `User_${phone.slice(-4)}`,
          role: 'PARTICIPANT',
          tier: 'B',
        },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

// Admin Login - Using username and password
// IMPORTANT: This requires database to ensure data integrity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('=== Admin Login Attempt ===');
    console.log('Username:', username);
    console.log('Password length:', password?.length);

    // Admin credentials
    const ADMIN_USERNAME = 'tazos';
    const ADMIN_PASSWORD = 'tazevsta';

    // Check credentials first
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('❌ Wrong credentials');
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    console.log('✅ Credentials correct, connecting to database...');

    // Find or create admin user in database
    // This is REQUIRED for data integrity - tournaments need valid user IDs
    const adminPhone = '+6281349924210';
    
    let user;
    try {
      user = await db.user.findUnique({
        where: { phone: adminPhone },
      });
      console.log('Existing user:', user ? user.id : 'Not found');

      if (!user) {
        user = await db.user.create({
          data: {
            phone: adminPhone,
            name: 'Tazos Admin',
            role: 'SUPER_ADMIN',
            tier: 'S',
          },
        });
        console.log('✅ Created new admin user:', user.id);
      } else if (user.role !== 'SUPER_ADMIN') {
        user = await db.user.update({
          where: { id: user.id },
          data: { role: 'SUPER_ADMIN', tier: 'S', name: 'Tazos Admin' },
        });
        console.log('✅ Updated admin user:', user.id);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please try again or contact support.',
          debug: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
        },
        { status: 500 }
      );
    }

    console.log('✅ Admin login successful:', user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error during admin login:', error);
    return NextResponse.json(
      { success: false, error: 'Login gagal - server error' },
      { status: 500 }
    );
  }
}
