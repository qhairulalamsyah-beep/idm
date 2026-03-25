import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default menus for permissions
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

// POST - Seed default roles
export async function POST(request: NextRequest) {
  try {
    // Check if roles already exist
    const existingRoles = await db.adminRole.count();

    if (existingRoles > 0) {
      return NextResponse.json({
        success: true,
        message: 'Roles sudah ada',
        data: await db.adminRole.findMany()
      });
    }

    // Create default roles
    const superAdminRole = await db.adminRole.create({
      data: {
        name: 'Super Admin',
        description: 'Akses penuh ke semua fitur',
        color: '#ef4444',
        isDefault: false,
        permissions: {
          create: DEFAULT_MENUS.map(menu => ({
            menuKey: menu.key,
            menuLabel: menu.label,
            canView: true,
            canEdit: true,
            canDelete: true,
            canCreate: true,
          }))
        }
      }
    });

    const adminRole = await db.adminRole.create({
      data: {
        name: 'Admin',
        description: 'Akses admin standar',
        color: '#3b82f6',
        isDefault: true,
        permissions: {
          create: DEFAULT_MENUS.map(menu => ({
            menuKey: menu.key,
            menuLabel: menu.label,
            canView: true,
            canEdit: menu.key !== 'admins' && menu.key !== 'settings',
            canDelete: false,
            canCreate: menu.key !== 'admins',
          }))
        }
      }
    });

    const moderatorRole = await db.adminRole.create({
      data: {
        name: 'Moderator',
        description: 'Akses terbatas untuk moderasi',
        color: '#22c55e',
        isDefault: false,
        permissions: {
          create: DEFAULT_MENUS.map(menu => ({
            menuKey: menu.key,
            menuLabel: menu.label,
            canView: ['home', 'tournaments', 'registrations', 'scoring'].includes(menu.key),
            canEdit: ['scoring'].includes(menu.key),
            canDelete: false,
            canCreate: false,
          }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Default roles berhasil dibuat',
      data: [superAdminRole, adminRole, moderatorRole]
    });
  } catch (error) {
    console.error('Error seeding roles:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat default roles' },
      { status: 500 }
    );
  }
}
