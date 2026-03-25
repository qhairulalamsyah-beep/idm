import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/registrations - List registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (status) where.status = status;

    const registrations = await db.registration.findMany({
      where,
      include: {
        user: {
          include: {
            clubs: {
              include: {
                club: true,
              },
            },
          },
        },
        tournament: {
          select: { name: true, division: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// POST /api/registrations - Create registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, division, name, phone, clubName } = body;

    // Check if tournament exists and is open
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'APPROVAL') {
      return NextResponse.json(
        { success: false, error: 'Tournament is not open for registration' },
        { status: 400 }
      );
    }

    if (tournament._count.registrations >= tournament.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Find or create user - use findUnique first, then upsert if not exists
    // This prevents "Unique constraint failed on the fields: (phone)" errors
    let user = await db.user.findUnique({ where: { phone } });

    if (!user) {
      user = await db.user.upsert({
        where: { phone },
        update: { name }, // update nama kalau perlu
        create: {
          phone,
          name,
          role: 'PARTICIPANT',
          tier: 'B'
        }
      });
    }

    // Check if already registered
    const existing = await db.registration.findUnique({
      where: {
        tournamentId_userId: { tournamentId, userId: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already registered' },
        { status: 400 }
      );
    }

    // Handle Club
    let club: { id: string; name: string } | null = null;
    if (clubName && clubName.trim()) {
      // Find or create club
      club = await db.club.findFirst({
        where: {
          name: {
            equals: clubName.trim(),
          },
        },
      });

      if (!club) {
        club = await db.club.create({
          data: {
            name: clubName.trim(),
          },
        });
      }

      // Add user to club if not already a member
      const existingMembership = await db.clubMember.findUnique({
        where: {
          clubId_userId: { clubId: club.id, userId: user.id },
        },
      });

      if (!existingMembership) {
        await db.clubMember.create({
          data: {
            clubId: club.id,
            userId: user.id,
            role: 'MEMBER',
          },
        });
      }
    }

    // Create registration (without tier - will be assigned by admin)
    const registration = await db.registration.create({
      data: {
        tournamentId,
        userId: user.id,
        division,
        status: 'PENDING',
        // tier will be assigned by admin during approval
      },
      include: {
        user: {
          include: {
            clubs: {
              include: { club: true },
            },
          },
        },
      },
    });

    // Update tournament current participants
    await db.tournament.update({
      where: { id: tournamentId },
      data: { currentParticipants: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...registration,
        club: club,
      },
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
