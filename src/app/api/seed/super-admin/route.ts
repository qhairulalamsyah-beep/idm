import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Check if super admin exists
export async function GET() {
  try {
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    return NextResponse.json({
      success: true,
      exists: !!superAdmin,
      data: superAdmin ? {
        id: superAdmin.id,
        name: superAdmin.name,
        phone: superAdmin.phone,
        role: superAdmin.role,
        tier: superAdmin.tier,
        createdAt: superAdmin.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Error checking super admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check super admin' },
      { status: 500 }
    );
  }
}

// POST - Create super admin in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name } = body;

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    // Validate password (must match the expected admin password)
    const adminPassword = 'tazevsta';
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+62' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('62') && !normalizedPhone.startsWith('+62')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // Check if super admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingAdmin) {
      // Update existing admin
      const updatedAdmin = await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          phone: normalizedPhone,
          name: name || 'Super Admin',
          role: 'SUPER_ADMIN',
          tier: 'S',
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Super Admin updated successfully',
        data: {
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          phone: updatedAdmin.phone,
          role: updatedAdmin.role,
          tier: updatedAdmin.tier,
        },
      });
    }

    // Create new super admin
    const superAdmin = await db.user.create({
      data: {
        phone: normalizedPhone,
        name: name || 'Super Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin created successfully',
      data: {
        id: superAdmin.id,
        name: superAdmin.name,
        phone: superAdmin.phone,
        role: superAdmin.role,
        tier: superAdmin.tier,
      },
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create super admin' },
      { status: 500 }
    );
  }
}

// PUT - Update super admin
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, password } = body;

    // Validate password
    const adminPassword = 'tazevsta';
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Find super admin
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super Admin not found' },
        { status: 404 }
      );
    }

    // Normalize phone if provided
    let normalizedPhone = superAdmin.phone;
    if (phone) {
      normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+62' + normalizedPhone.substring(1);
      } else if (normalizedPhone.startsWith('62') && !normalizedPhone.startsWith('+62')) {
        normalizedPhone = '+' + normalizedPhone;
      }
    }

    // Update super admin
    const updatedAdmin = await db.user.update({
      where: { id: superAdmin.id },
      data: {
        phone: normalizedPhone,
        name: name || superAdmin.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin updated successfully',
      data: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error updating super admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update super admin' },
      { status: 500 }
    );
  }
}

// DELETE - Remove super admin (requires password)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Validate password
    const adminPassword = 'tazevsta';
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Find and delete super admin
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super Admin not found' },
        { status: 404 }
      );
    }

    await db.user.delete({
      where: { id: superAdmin.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting super admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete super admin' },
      { status: 500 }
    );
  }
}
