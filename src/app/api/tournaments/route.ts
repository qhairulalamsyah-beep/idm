import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createTournament, getTournaments } from '@/lib/tournament/engine';

// GET /api/tournaments - List all tournaments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') as 'MALE' | 'FEMALE' | null;
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (division) where.division = division;
    // Handle comma-separated status values
    if (status) {
      const statusValues = status.split(',');
      if (statusValues.length === 1) {
        where.status = statusValues[0];
      } else {
        where.status = { in: statusValues };
      }
    }

    const tournaments = await db.tournament.findMany({
      where,
      include: {
        prizePool: true,
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                tier: true,
                clubs: {
                  include: {
                    club: { select: { id: true, name: true } }
                  }
                }
              }
            }
          }
        },
        teams: {
          include: {
            members: { include: { user: { select: { name: true } } } }
          }
        },
        _count: {
          select: { registrations: true, teams: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Calculate actual participant counts and map tier from registration
    const tournamentsWithCounts = tournaments.map(t => ({
      ...t,
      registrations: t.registrations.map(reg => ({
        ...reg,
        // Use registration tier if available, otherwise user tier
        displayTier: reg.tier || reg.user.tier,
      })),
      pendingCount: t.registrations.filter(r => r.status === 'PENDING').length,
      approvedCount: t.registrations.filter(r => r.status === 'APPROVED').length,
      actualParticipants: t.registrations.filter(r => r.status === 'APPROVED').length,
    }));

    return NextResponse.json({
      success: true,
      data: tournamentsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      division,
      mode,
      bpm,
      bracketType,
      maxParticipants,
      startDate,
      location,
      rules,
      championAmount,
      runnerUpAmount,
      thirdPlaceAmount,
      mvpAmount,
    } = body;

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        name,
        division,
        mode: mode || 'GR Arena 3vs3',
        bpm: bpm || 'Random 120-140',
        bracketType: bracketType || 'SINGLE_ELIMINATION',
        maxParticipants: maxParticipants || 16,
        startDate: new Date(startDate),
        location,
        rules,
        status: 'SETUP',
      },
    });

    // Create prize pool
    await db.prizePool.create({
      data: {
        tournamentId: tournament.id,
        championAmount: championAmount || 0,
        runnerUpAmount: runnerUpAmount || 0,
        thirdPlaceAmount: thirdPlaceAmount || 0,
        mvpAmount: mvpAmount || 0,
        totalAmount: (championAmount || 0) + (runnerUpAmount || 0) + (thirdPlaceAmount || 0) + (mvpAmount || 0),
      },
    });

    return NextResponse.json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
