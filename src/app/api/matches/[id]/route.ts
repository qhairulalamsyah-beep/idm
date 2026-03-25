import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateMatchScore } from '@/lib/tournament/engine';
import { emitScoreUpdate } from '@/lib/socket-client';

const WA_BOT_URL = 'http://localhost:3004';

// Helper to send WhatsApp notification
async function sendWANotification(event: string, data: Record<string, unknown>) {
  try {
    await fetch(`${WA_BOT_URL}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    });
  } catch (error) {
    console.error('[WA] Failed to send notification:', error);
  }
}

// GET /api/matches/[id] - Get match by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: {
          include: { members: { include: { user: true } } },
        },
        awayTeam: {
          include: { members: { include: { user: true } } },
        },
        bracket: {
          include: { tournament: true },
        },
        group: true,
        result: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

// PUT /api/matches/[id] - Update match (score, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { homeScore, awayScore, status, scheduledAt, homeTeamId, awayTeamId } = body;

    // Get current match state for comparison
    const currentMatch = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        bracket: { include: { tournament: true } },
      },
    });

    if (!currentMatch) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // If scores are provided, use the update match score function
    if (homeScore !== undefined && awayScore !== undefined) {
      const result = await updateMatchScore(id, homeScore, awayScore);
      
      // Emit socket event for real-time update
      emitScoreUpdate({
        matchId: id,
        tournamentId: currentMatch.tournamentId,
        homeScore,
        awayScore,
        status: 'COMPLETED',
        winnerId: result.winnerId || undefined,
      });

      // Send WhatsApp notification for match result
      const winner = homeScore > awayScore 
        ? currentMatch.homeTeam?.name 
        : currentMatch.awayTeam?.name;
      
      await sendWANotification('match-end', {
        homeTeam: currentMatch.homeTeam?.name || 'TBD',
        awayTeam: currentMatch.awayTeam?.name || 'TBD',
        homeScore,
        awayScore,
        winner,
        tournament: currentMatch.bracket?.tournament?.name,
        link: `https://idolmeta.id/bracket/${currentMatch.tournamentId}`,
      });
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Update match fields
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (homeTeamId !== undefined) updateData.homeTeamId = homeTeamId;
    if (awayTeamId !== undefined) updateData.awayTeamId = awayTeamId;

    const match = await db.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Send WhatsApp notification if match is starting
    if (status === 'IN_PROGRESS' && currentMatch.status !== 'IN_PROGRESS') {
      await sendWANotification('match-start', {
        homeTeam: match.homeTeam?.name || 'TBD',
        awayTeam: match.awayTeam?.name || 'TBD',
        tournament: currentMatch.bracket?.tournament?.name,
        link: `https://idolmeta.id/bracket/${currentMatch.tournamentId}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

// PATCH /api/matches/[id] - Partial update match
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { homeScore, awayScore, status, homeTeamId, awayTeamId } = body;

    // Get current match state for comparison
    const currentMatch = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        bracket: { include: { tournament: true } },
      },
    });

    if (!currentMatch) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // If scores are provided, use the update match score function
    if (homeScore !== undefined && awayScore !== undefined) {
      const result = await updateMatchScore(id, homeScore, awayScore);
      
      // Emit socket event for real-time update
      emitScoreUpdate({
        matchId: id,
        tournamentId: currentMatch.tournamentId,
        homeScore,
        awayScore,
        status: 'COMPLETED',
        winnerId: result.winnerId || undefined,
      });

      // Send WhatsApp notification for match result
      const winner = homeScore > awayScore 
        ? currentMatch.homeTeam?.name 
        : currentMatch.awayTeam?.name;
      
      await sendWANotification('match-end', {
        homeTeam: currentMatch.homeTeam?.name || 'TBD',
        awayTeam: currentMatch.awayTeam?.name || 'TBD',
        homeScore,
        awayScore,
        winner,
        tournament: currentMatch.bracket?.tournament?.name,
        link: `https://idolmeta.id/bracket/${currentMatch.tournamentId}`,
      });
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Otherwise, just update the match fields provided
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (homeTeamId !== undefined) updateData.homeTeamId = homeTeamId;
    if (awayTeamId !== undefined) updateData.awayTeamId = awayTeamId;

    const match = await db.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Send WhatsApp notification if match is starting
    if (status === 'IN_PROGRESS' && currentMatch.status !== 'IN_PROGRESS') {
      await sendWANotification('match-start', {
        homeTeam: match.homeTeam?.name || 'TBD',
        awayTeam: match.awayTeam?.name || 'TBD',
        tournament: currentMatch.bracket?.tournament?.name,
        link: `https://idolmeta.id/bracket/${currentMatch.tournamentId}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Error patching match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update match' },
      { status: 500 }
    );
  }
}
