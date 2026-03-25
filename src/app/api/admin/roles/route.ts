import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default menu permissions for admin panel
const DEFAULT_MENUS = [
  { key: 'home', label: 'Dashboard' },
  { key: 'tournaments', label: 'Turnamen' },
  { key: 'registrations', label: 'Pendaftaran' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'donations', label: 'Donasi/Saweran' },
  { key: 'admins', label: 'Role Admin' },
  { key: 'users', label: 'Manajemen User' },
  { key: 'clubs', label: 'Manajemen Club' },
  { key: 'notifications', label: 'Notifikasi' },
  { key: 'settings', label: 'Pengaturan' },
];

// GET - List all roles with their permissions
export async function GET() {
  try {
    const roles = await db.adminRole.findMany({
      include: {
        permissions: true,
        _count: {
          select: { userAdmins: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data role' },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, permissions } = body;

    // Check if role name already exists
    const existingRole = await db.adminRole.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Nama role sudah digunakan' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await db.adminRole.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        permissions: {
          create: (permissions || DEFAULT_MENUS).map((menu: { key: string; label: string }) => ({
            menuKey: menu.key,
            menuLabel: menu.label,
            canView: false,
            canEdit: false,
            canDelete: false,
            canCreate: false,
          }))
        }
      },
      include: {
        permissions: true
      }
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat role' },
      { status: 500 }
    );
  }
}
