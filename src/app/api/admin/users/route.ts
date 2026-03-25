import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      include: {
        clubs: {
          include: {
            club: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
      points: user.points,
      isActive: user.isActive,
      clubs: user.clubs
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
