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

    // TODO: Send OTP via WhatsApp using Baileys or WhatsApp Cloud API
    // For now, we'll just return the OTP for testing
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, remove this:
      debug: { otp }, // Remove in production
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

    // Find valid OTP
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

    // Mark OTP as used
    await db.oTPCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create user
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

    // Update last login
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
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('Admin login attempt:', { username, password });

    // Admin credentials
    const adminUsername = 'tazos';
    const adminPassword = 'tazevsta';

    if (username === adminUsername && password === adminPassword) {
      // Find or create super admin
      const adminPhone = '+6281349924210'; // Keep unique phone for DB
      let user = await db.user.findUnique({
        where: { phone: adminPhone },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            phone: adminPhone,
            name: 'Tazos Admin',
            role: 'SUPER_ADMIN',
            tier: 'S',
          },
        });
      } else if (user.role !== 'SUPER_ADMIN') {
        user = await db.user.update({
          where: { id: user.id },
          data: { role: 'SUPER_ADMIN', tier: 'S', name: 'Tazos Admin' },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Username atau password salah' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { success: false, error: 'Login gagal' },
      { status: 500 }
    );
  }
}
