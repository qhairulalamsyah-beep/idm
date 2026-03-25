import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/tournaments/[id]/reset - Reset tournament completely
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { maxParticipants } = body;

    // Get tournament first
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
            teams: true,
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Delete all matches
    const deletedMatches = await db.match.deleteMany({
      where: { tournamentId: id }
    });

    // Delete all brackets
    const deletedBrackets = await db.bracket.deleteMany({
      where: { tournamentId: id }
    });

    // Delete all teams
    const deletedTeams = await db.team.deleteMany({
      where: { tournamentId: id }
    });

    // Delete all registrations
    const deletedRegistrations = await db.registration.deleteMany({
      where: { tournamentId: id }
    });

    // Update tournament status back to REGISTRATION
    const updatedTournament = await db.tournament.update({
      where: { id },
      data: {
        status: 'REGISTRATION',
        maxParticipants: maxParticipants || tournament.maxParticipants,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament has been reset successfully',
      data: {
        tournament: updatedTournament,
        deleted: {
          matches: deletedMatches.count,
          brackets: deletedBrackets.count,
          teams: deletedTeams.count,
          registrations: deletedRegistrations.count
        }
      }
    });
  } catch (error) {
    console.error('Error resetting tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset tournament' },
      { status: 500 }
    );
  }
}
