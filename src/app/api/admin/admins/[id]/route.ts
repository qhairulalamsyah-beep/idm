import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single admin details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await db.user.findUnique({
      where: { id },
      include: {
        adminProfile: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data admin' },
      { status: 500 }
    );
  }
}

// PUT - Update admin profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, roleId, isActive, notes } = body;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: { adminProfile: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent modifying super admin
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat memodifikasi Super Admin' },
        { status: 403 }
      );
    }

    // Update user basic info
    await db.user.update({
      where: { id },
      data: {
        name: name || user.name,
        email: email || user.email,
      }
    });

    // Update admin profile if exists
    if (user.adminProfile) {
      await db.userAdminProfile.update({
        where: { userId: id },
        data: {
          roleId: roleId || user.adminProfile.roleId,
          isActive: isActive !== undefined ? isActive : user.adminProfile.isActive,
          notes: notes !== undefined ? notes : user.adminProfile.notes,
        }
      });
    } else if (roleId) {
      // Create admin profile if not exists
      await db.userAdminProfile.create({
        data: {
          userId: id,
          roleId,
          notes
        }
      });
    }

    // Fetch updated admin
    const result = await db.user.findUnique({
      where: { id },
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
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui admin' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin (demote to participant)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: { adminProfile: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent deleting super admin
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus Super Admin' },
        { status: 403 }
      );
    }

    // Delete admin profile
    if (user.adminProfile) {
      await db.userAdminProfile.delete({
        where: { userId: id }
      });
    }

    // Demote user role to participant
    await db.user.update({
      where: { id },
      data: { role: 'PARTICIPANT' }
    });

    return NextResponse.json({ success: true, message: 'Admin berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus admin' },
      { status: 500 }
    );
  }
}
