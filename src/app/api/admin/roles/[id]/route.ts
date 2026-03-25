import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single role with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await db.adminRole.findUnique({
      where: { id },
      include: {
        permissions: true,
        userAdmins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data role' },
      { status: 500 }
    );
  }
}

// PUT - Update role and permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color, permissions } = body;

    // Check if role exists
    const existingRole = await db.adminRole.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another role
    if (name && name !== existingRole.name) {
      const nameConflict = await db.adminRole.findUnique({
        where: { name }
      });
      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Nama role sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Update role basic info
    const updatedRole = await db.adminRole.update({
      where: { id },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        color: color || existingRole.color,
      }
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await db.adminPermission.upsert({
          where: {
            roleId_menuKey: {
              roleId: id,
              menuKey: perm.menuKey
            }
          },
          create: {
            roleId: id,
            menuKey: perm.menuKey,
            menuLabel: perm.menuLabel,
            canView: perm.canView || false,
            canEdit: perm.canEdit || false,
            canDelete: perm.canDelete || false,
            canCreate: perm.canCreate || false,
          },
          update: {
            menuLabel: perm.menuLabel,
            canView: perm.canView || false,
            canEdit: perm.canEdit || false,
            canDelete: perm.canDelete || false,
            canCreate: perm.canCreate || false,
          }
        });
      }
    }

    // Fetch updated role with permissions
    const result = await db.adminRole.findUnique({
      where: { id },
      include: { permissions: true }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui role' },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if role exists
    const role = await db.adminRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userAdmins: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if role has users assigned
    if (role._count.userAdmins > 0) {
      return NextResponse.json(
        { success: false, error: `Tidak dapat menghapus role. Masih ada ${role._count.userAdmins} admin yang menggunakan role ini.` },
        { status: 400 }
      );
    }

    // Delete role (permissions will cascade delete)
    await db.adminRole.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Role berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus role' },
      { status: 500 }
    );
  }
}
