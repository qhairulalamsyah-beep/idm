import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/clubs - Get all clubs
export async function GET(request: NextRequest) {
  try {
    const clubs = await db.club.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { totalPoints: 'desc' }
    });

    const formattedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      logo: club.logo,
      totalPoints: club.totalPoints,
      ranking: club.ranking,
      _count: club._count
    }));

    return NextResponse.json({ success: true, data: formattedClubs });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch clubs' }, { status: 500 });
  }
}
