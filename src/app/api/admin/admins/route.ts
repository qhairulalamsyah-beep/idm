import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all admins with their roles
export async function GET() {
  try {
    // Get all users with admin profiles or admin/super_admin role
    const admins = await db.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'ADMIN' },
          { adminProfile: { isNot: null } }
        ]
      },
      include: {
        adminProfile: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data admin' },
      { status: 500 }
    );
  }
}

// POST - Add new admin (create user or promote existing user)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, email, roleId, notes } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Nomor telepon wajib diisi' },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Role wajib dipilih' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await db.adminRole.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { phone },
      include: { adminProfile: true }
    });

    let userId: string;

    if (existingUser) {
      // Check if user is already an admin
      if (existingUser.adminProfile) {
        return NextResponse.json(
          { success: false, error: 'User sudah terdaftar sebagai admin' },
          { status: 400 }
        );
      }

      // Update existing user to admin
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ADMIN',
          name: name || existingUser.name,
          email: email || existingUser.email,
        }
      });

      // Create admin profile
      await db.userAdminProfile.create({
        data: {
          userId: existingUser.id,
          roleId,
          notes
        }
      });

      userId = existingUser.id;
    } else {
      // Create new user as admin
      const newUser = await db.user.create({
        data: {
          phone,
          name,
          email,
          role: 'ADMIN',
          adminProfile: {
            create: {
              roleId,
              notes
            }
          }
        }
      });
      userId = newUser.id;
    }

    // Fetch complete user with admin profile
    const result = await db.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: {
          include: {
            role: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan admin' },
      { status: 500 }
    );
  }
}
