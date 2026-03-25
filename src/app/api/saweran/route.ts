import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/saweran - List saweran for a prize pool
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prizePoolId = searchParams.get('prizePoolId');
    const all = searchParams.get('all');

    // If all=true, return all saweran including pending (for admin)
    // Otherwise, only return completed saweran
    const statusFilter = all === 'true' ? {} : { status: 'COMPLETED' as const };
    const where = prizePoolId ? { prizePoolId, ...statusFilter } : statusFilter;

    const saweran = await db.saweran.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = await db.saweran.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: saweran,
      total: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching saweran:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saweran' },
      { status: 500 }
    );
  }
}

// POST /api/saweran - Create saweran
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prizePoolId, name, amount, message, paymentMethod, userId } = body;

    if (!name || !amount || amount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Nama wajib diisi dan minimal Rp 10.000' },
        { status: 400 }
      );
    }

    // If no prizePoolId provided, find or create a default one
    let targetPrizePoolId = prizePoolId;
    
    if (!targetPrizePoolId) {
      // Find the first active tournament with a prize pool
      const tournament = await db.tournament.findFirst({
        where: {
          status: { in: ['REGISTRATION', 'APPROVAL', 'TEAM_GENERATION', 'BRACKET_GENERATION', 'IN_PROGRESS'] }
        },
        include: { prizePool: true },
        orderBy: { createdAt: 'desc' },
      });

      if (tournament?.prizePool) {
        targetPrizePoolId = tournament.prizePool.id;
      } else if (tournament) {
        // Tournament exists but no prize pool, create one
        const prizePool = await db.prizePool.create({
          data: {
            tournamentId: tournament.id,
            championAmount: 0,
            runnerUpAmount: 0,
            thirdPlaceAmount: 0,
            mvpAmount: 0,
            totalAmount: 0,
          },
        });
        targetPrizePoolId = prizePool.id;
      } else {
        // No tournament at all, create a default tournament and prize pool
        const defaultTournament = await db.tournament.create({
          data: {
            name: 'Turnamen Saweran',
            division: 'MALE',
            mode: 'GR Arena 3vs3',
            bpm: 'Random 120-140',
            bracketType: 'SINGLE_ELIMINATION',
            status: 'REGISTRATION',
            maxParticipants: 8,
            location: 'Pub 1',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        });
        
        const prizePool = await db.prizePool.create({
          data: {
            tournamentId: defaultTournament.id,
            championAmount: 0,
            runnerUpAmount: 0,
            thirdPlaceAmount: 0,
            mvpAmount: 0,
            totalAmount: 0,
          },
        });
        targetPrizePoolId = prizePool.id;
      }
    }

    const saweran = await db.saweran.create({
      data: {
        prizePoolId: targetPrizePoolId,
        name,
        amount,
        message,
        paymentMethod,
        userId,
        status: 'PENDING',
      },
      include: {
        prizePool: {
          include: { tournament: true }
        }
      },
    });

    return NextResponse.json({
      success: true,
      data: saweran,
      message: 'Saweran berhasil dibuat. Silakan lakukan pembayaran.',
    });
  } catch (error) {
    console.error('Error creating saweran:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create saweran: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// PUT /api/saweran - Confirm saweran payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID dan status wajib diisi' },
        { status: 400 }
      );
    }

    const saweran = await db.saweran.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: { prizePool: true },
    });

    // Update prize pool total if completed
    if (status === 'COMPLETED' && saweran.prizePool) {
      await db.prizePool.update({
        where: { id: saweran.prizePoolId },
        data: {
          totalAmount: {
            increment: saweran.amount,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: saweran,
      message: status === 'COMPLETED' 
        ? 'Saweran berhasil dikonfirmasi dan prize pool telah diperbarui' 
        : 'Status saweran diperbarui',
    });
  } catch (error) {
    console.error('Error updating saweran:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saweran' },
      { status: 500 }
    );
  }
}
