import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/tournaments/[id]/reset-status - Reset tournament status and clean up data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetStatus } = body;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        bracket: true,
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Clean up data based on target status
    if (targetStatus === 'APPROVAL') {
      // Delete all teams and bracket when going back to APPROVAL
      if (tournament.bracket) {
        // Delete matches first
        await db.match.deleteMany({
          where: { bracketId: tournament.bracket.id },
        });
        // Delete groups if any
        await db.group.deleteMany({
          where: { bracketId: tournament.bracket.id },
        });
        // Delete the bracket
        await db.bracket.delete({
          where: { id: tournament.bracket.id },
        });
      }

      // Delete team members first, then teams
      const teamIds = tournament.teams.map(t => t.id);
      if (teamIds.length > 0) {
        await db.teamMember.deleteMany({
          where: { teamId: { in: teamIds } },
        });
        await db.team.deleteMany({
          where: { tournamentId: id },
        });
      }
    } else if (targetStatus === 'TEAM_GENERATION') {
      // Delete bracket when going back to TEAM_GENERATION
      if (tournament.bracket) {
        await db.match.deleteMany({
          where: { bracketId: tournament.bracket.id },
        });
        await db.group.deleteMany({
          where: { bracketId: tournament.bracket.id },
        });
        await db.bracket.delete({
          where: { id: tournament.bracket.id },
        });
      }
    } else if (targetStatus === 'BRACKET_GENERATION') {
      // Just reset status, keep bracket
    }

    // Update tournament status
    const updatedTournament = await db.tournament.update({
      where: { id },
      data: {
        status: targetStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTournament,
      message: `Status direset ke ${targetStatus}`,
    });
  } catch (error) {
    console.error('Error resetting tournament status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset tournament status' },
      { status: 500 }
    );
  }
}
