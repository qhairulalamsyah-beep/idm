// Database Archiving Utilities
// Moves old tournament data to archive tables for better performance

import { db } from '@/lib/db';

// Archive threshold (days)
const ARCHIVE_AFTER_DAYS = 30;

// Archive a completed tournament
export async function archiveTournament(tournamentId: string) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: {
            result: true,
            homeTeam: {
              include: { members: true },
            },
            awayTeam: {
              include: { members: true },
            },
          },
        },
        teams: {
          include: {
            members: true,
          },
        },
        registrations: true,
        champion: true,
      },
    });

    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    // Only archive completed tournaments older than threshold
    if (tournament.status !== 'COMPLETED') {
      return { success: false, error: 'Tournament not completed' };
    }

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - ARCHIVE_AFTER_DAYS);
    
    if (tournament.endDate && new Date(tournament.endDate) > threshold) {
      return { success: false, error: 'Tournament too recent to archive' };
    }

    // Create match history records for all participants
    for (const match of tournament.matches) {
      if (match.status !== 'COMPLETED' || !match.winnerId) continue;

      const homeTeam = match.homeTeamId 
        ? await db.team.findUnique({ 
            where: { id: match.homeTeamId },
            include: { members: true },
          })
        : null;
      
      const awayTeam = match.awayTeamId
        ? await db.team.findUnique({
            where: { id: match.awayTeamId },
            include: { members: true },
          })
        : null;

      // Create history for home team members
      if (homeTeam) {
        for (const member of homeTeam.members) {
          await db.matchHistory.create({
            data: {
              userId: member.userId,
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              division: tournament.division,
              teamId: homeTeam.id,
              teamName: homeTeam.name,
              matchId: match.id,
              opponentName: awayTeam?.name,
              result: match.winnerId === homeTeam.id ? 'WIN' : 'LOSS',
              score: `${match.homeScore || 0}-${match.awayScore || 0}`,
              round: match.round,
              bracketSide: match.bracketSide || undefined,
              playedAt: match.completedAt || match.createdAt,
            },
          });
        }
      }

      // Create history for away team members
      if (awayTeam) {
        for (const member of awayTeam.members) {
          await db.matchHistory.create({
            data: {
              userId: member.userId,
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              division: tournament.division,
              teamId: awayTeam.id,
              teamName: awayTeam.name,
              matchId: match.id,
              opponentName: homeTeam?.name,
              result: match.winnerId === awayTeam.id ? 'WIN' : 'LOSS',
              score: `${match.awayScore || 0}-${match.homeScore || 0}`,
              round: match.round,
              bracketSide: match.bracketSide || undefined,
              playedAt: match.completedAt || match.createdAt,
            },
          });
        }
      }
    }

    // Update player stats for all participants
    for (const registration of tournament.registrations) {
      if (registration.status !== 'APPROVED') continue;

      const user = await db.user.findUnique({
        where: { id: registration.userId },
        include: { playerStats: true },
      });

      if (!user) continue;

      // Ensure player stats exist
      if (!user.playerStats) {
        await db.playerStats.create({
          data: { userId: user.id },
        });
      }

      // Calculate tournament result
      let result = { won: false, runnerUp: false, thirdPlace: false };
      
      if (tournament.champion) {
        const championTeam = await db.team.findUnique({
          where: { id: tournament.champion.championTeamId },
          include: { members: true },
        });
        
        if (championTeam?.members.some(m => m.userId === user.id)) {
          result.won = true;
        }

        const runnerUpTeam = await db.team.findUnique({
          where: { id: tournament.champion.runnerUpTeamId },
          include: { members: true },
        });
        
        if (runnerUpTeam?.members.some(m => m.userId === user.id)) {
          result.runnerUp = true;
        }
      }

      // Update stats
      const matchesPlayed = tournament.matches.filter(
        m => m.status === 'COMPLETED' && 
        (m.homeTeam?.members.some(mem => mem.userId === user.id) ||
         m.awayTeam?.members.some(mem => mem.userId === user.id))
      ).length;

      const matchesWon = tournament.matches.filter(
        m => m.status === 'COMPLETED' && m.winnerId &&
        (m.homeTeam?.members.some(mem => mem.userId === user.id) ||
         m.awayTeam?.members.some(mem => mem.userId === user.id)) &&
        ((m.winnerId === m.homeTeamId && m.homeTeam?.members.some(mem => mem.userId === user.id)) ||
         (m.winnerId === m.awayTeamId && m.awayTeam?.members.some(mem => mem.userId === user.id)))
      ).length;

      await db.playerStats.update({
        where: { userId: user.id },
        data: {
          tournamentsPlayed: { increment: 1 },
          tournamentsWon: { increment: result.won ? 1 : 0 },
          tournamentsRunnerUp: { increment: result.runnerUp ? 1 : 0 },
          matchesPlayed: { increment: matchesPlayed },
          matchesWon: { increment: matchesWon },
          matchesLost: { increment: matchesPlayed - matchesWon },
        },
      });
    }

    console.log(`[Archive] Tournament ${tournamentId} archived successfully`);
    return { success: true };
  } catch (error) {
    console.error('[Archive] Error:', error);
    return { success: false, error: 'Failed to archive tournament' };
  }
}

// Auto-archive old tournaments
export async function autoArchiveOldTournaments() {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - ARCHIVE_AFTER_DAYS);

    const oldTournaments = await db.tournament.findMany({
      where: {
        status: 'COMPLETED',
        endDate: { lt: threshold },
      },
      select: { id: true },
    });

    const results: { id: string; success: boolean; error?: string }[] = [];
    for (const t of oldTournaments) {
      const result = await archiveTournament(t.id);
      results.push({ id: t.id, ...result });
    }

    return {
      success: true,
      archived: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
  } catch (error) {
    console.error('[AutoArchive] Error:', error);
    return { success: false, error: 'Auto-archive failed' };
  }
}

// Get archived match history for a user
export async function getUserMatchHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  return db.matchHistory.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

// Get tournament archive summary
export async function getArchiveStats() {
  const totalArchived = await db.matchHistory.count();
  const uniqueTournaments = await db.matchHistory.groupBy({
    by: ['tournamentId'],
    _count: true,
  });

  return {
    totalMatches: totalArchived,
    tournamentsArchived: uniqueTournaments.length,
  };
}

const archiveService = {
  archiveTournament,
  autoArchiveOldTournaments,
  getUserMatchHistory,
  getArchiveStats,
};

export default archiveService;
