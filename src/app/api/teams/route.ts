import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTeams } from '@/lib/tournament/engine';

// GET /api/teams - List teams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const clubId = searchParams.get('clubId');

    const where: Record<string, unknown> = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (clubId) where.clubId = clubId;

    const teams = await db.team.findMany({
      where,
      include: {
        members: {
          include: { user: true },
        },
        club: true,
        tournament: {
          select: { name: true, division: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create team or generate teams
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, name, memberIds, clubId, generate } = body;

    // If generate flag is set, auto-generate teams
    if (generate) {
      await generateTeams(tournamentId);

      // Fetch the generated teams with full data
      const teams = await db.team.findMany({
        where: { tournamentId },
        include: {
          members: {
            include: { user: true },
          },
          club: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: teams,
        message: `Generated ${teams.length} teams`,
      });
    }

    // Manual team creation
    const team = await db.team.create({
      data: {
        tournamentId,
        name,
        clubId,
        isGenerated: false,
        members: {
          create: memberIds.map((userId: string, index: number) => ({
            userId,
            isCaptain: index === 0,
          })),
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams - Delete all teams for a tournament (cancel generate)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Get all teams for this tournament
    const teams = await db.team.findMany({
      where: { tournamentId },
      select: { id: true },
    });

    const teamIds = teams.map(t => t.id);

    // Delete team members first
    if (teamIds.length > 0) {
      await db.teamMember.deleteMany({
        where: { teamId: { in: teamIds } },
      });

      // Delete the teams
      await db.team.deleteMany({
        where: { tournamentId },
      });
    }

    // Update tournament status back to APPROVAL
    await db.tournament.update({
      where: { id: tournamentId },
      data: { status: 'APPROVAL' },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${teamIds.length} teams`,
    });
  } catch (error) {
    console.error('Error deleting teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete teams' },
      { status: 500 }
    );
  }
}
