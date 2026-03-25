import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get counts
    const [totalTournaments, activeTournaments, totalUsers, totalClubs, pendingRegistrations, prizePools] = await Promise.all([
      db.tournament.count(),
      db.tournament.count({ where: { status: { in: ['REGISTRATION', 'IN_PROGRESS'] } } }),
      db.user.count({ where: { role: 'PARTICIPANT' } }),
      db.club.count(),
      db.registration.count({ where: { status: 'PENDING' } }),
      db.prizePool.findMany({ select: { totalAmount: true } })
    ]);

    const totalPrizePool = prizePools.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalTournaments,
        activeTournaments,
        totalUsers,
        totalClubs,
        pendingRegistrations,
        totalPrizePool
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
