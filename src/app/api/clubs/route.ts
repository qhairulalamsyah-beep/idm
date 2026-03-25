import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/clubs - List all clubs
export async function GET(request: NextRequest) {
  try {
    const clubs = await db.club.findMany({
      include: {
        members: {
          include: { user: true },
        },
        teams: {
          include: {
            tournament: { select: { name: true, division: true } },
          },
        },
        _count: { select: { teams: true, members: true } },
      },
      orderBy: { totalPoints: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}

// POST /api/clubs - Create new club
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logo, description, ownerId } = body;

    const club = await db.club.create({
      data: {
        name,
        logo,
        description,
        members: ownerId ? {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        } : undefined,
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: club,
    });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create club' },
      { status: 500 }
    );
  }
}
