import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBracket } from '@/lib/tournament/engine';

// GET /api/brackets - List brackets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    const where: Record<string, unknown> = {};
    if (tournamentId) where.tournamentId = tournamentId;

    const brackets = await db.bracket.findMany({
      where,
      include: {
        tournament: {
          select: { name: true, division: true, bracketType: true },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
        },
        groups: {
          include: {
            members: {
              include: { team: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: brackets,
    });
  } catch (error) {
    console.error('Error fetching brackets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brackets' },
      { status: 500 }
    );
  }
}

// POST /api/brackets - Generate bracket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId } = body;

    const bracket = await generateBracket(tournamentId);

    return NextResponse.json({
      success: true,
      data: bracket,
      message: 'Bracket generated successfully',
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate bracket' },
      { status: 500 }
    );
  }
}
