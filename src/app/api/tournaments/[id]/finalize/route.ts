import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

// POST /api/tournaments/[id]/finalize - Finalize tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    let { championTeamId, runnerUpTeamId, thirdPlaceTeamId, mvpId } = body;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        prizePool: true,
        bracket: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
              orderBy: [{ round: 'desc' }, { matchNumber: 'desc' }],
            },
          },
        },
        teams: {
          include: {
            members: { include: { user: true } },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Allow finalization from IN_PROGRESS or FINALIZATION status
    if (!['IN_PROGRESS', 'FINALIZATION'].includes(tournament.status)) {
      return NextResponse.json(
        { success: false, error: 'Tournament is not ready for finalization' },
        { status: 400 }
      );
    }

    // Auto-determine champion if not provided
    if (!championTeamId && tournament.bracket?.matches) {
      const completedMatches = tournament.bracket.matches.filter(
        (m) => m.status === 'COMPLETED'
      );

      if (completedMatches.length > 0) {
        // For elimination brackets, find the final match (highest round)
        if (['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'].includes(tournament.bracketType)) {
          const finalMatch = completedMatches[0];
          if (finalMatch.homeScore !== null && finalMatch.awayScore !== null) {
            championTeamId =
              finalMatch.homeScore > finalMatch.awayScore
                ? finalMatch.homeTeamId
                : finalMatch.awayTeamId;
            runnerUpTeamId =
              finalMatch.homeScore > finalMatch.awayScore
                ? finalMatch.awayTeamId
                : finalMatch.homeTeamId;
          }
        } else {
          // For ROUND_ROBIN, GROUP_STAGE, SWISS - calculate standings based on wins
          const teamStats = new Map<string, { wins: number; losses: number; draws: number; scoreFor: number; scoreAgainst: number }>();
          
          for (const match of completedMatches) {
            if (!match.homeTeamId || !match.awayTeamId) continue;
            
            // Initialize home team stats
            if (!teamStats.has(match.homeTeamId)) {
              teamStats.set(match.homeTeamId, { wins: 0, losses: 0, draws: 0, scoreFor: 0, scoreAgainst: 0 });
            }
            // Initialize away team stats  
            if (!teamStats.has(match.awayTeamId)) {
              teamStats.set(match.awayTeamId, { wins: 0, losses: 0, draws: 0, scoreFor: 0, scoreAgainst: 0 });
            }
            
            const homeStats = teamStats.get(match.homeTeamId)!;
            const awayStats = teamStats.get(match.awayTeamId)!;
            
            const homeScore = match.homeScore ?? 0;
            const awayScore = match.awayScore ?? 0;
            
            homeStats.scoreFor += homeScore;
            homeStats.scoreAgainst += awayScore;
            awayStats.scoreFor += awayScore;
            awayStats.scoreAgainst += homeScore;
            
            if (homeScore > awayScore) {
              homeStats.wins++;
              awayStats.losses++;
            } else if (awayScore > homeScore) {
              awayStats.wins++;
              homeStats.losses++;
            } else {
              homeStats.draws++;
              awayStats.draws++;
            }
          }
          
          // Sort by wins, then by score difference
          const sortedTeams = Array.from(teamStats.entries())
            .sort((a, b) => {
              const aWinDiff = a[1].wins - a[1].losses;
              const bWinDiff = b[1].wins - b[1].losses;
              if (bWinDiff !== aWinDiff) return bWinDiff;
              const aScoreDiff = a[1].scoreFor - a[1].scoreAgainst;
              const bScoreDiff = b[1].scoreFor - b[1].scoreAgainst;
              return bScoreDiff - aScoreDiff;
            });
          
          if (sortedTeams.length > 0) {
            championTeamId = sortedTeams[0][0];
            if (sortedTeams.length > 1) {
              runnerUpTeamId = sortedTeams[1][0];
            }
            if (sortedTeams.length > 2) {
              thirdPlaceTeamId = sortedTeams[2][0];
            }
          }
        }
      }
    }

    if (!championTeamId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine champion' },
        { status: 400 }
      );
    }

    // Use upsert to handle unique constraint on tournamentId
    // This prevents errors if finalize is called multiple times
    const champion = await db.champion.upsert({
      where: { tournamentId: id },
      update: {
        championTeamId,
        runnerUpTeamId,
        thirdPlaceTeamId,
        mvpId,
        finalizedAt: new Date(),
      },
      create: {
        tournamentId: id,
        championTeamId,
        runnerUpTeamId,
        thirdPlaceTeamId,
        mvpId,
      },
    });

    // Award MVP prize - delete any existing first to prevent duplicates
    if (mvpId && tournament.prizePool) {
      await db.mVPAward.deleteMany({
        where: { tournamentId: id },
      });
      await db.mVPAward.create({
        data: {
          userId: mvpId,
          tournamentId: id,
          prizeAmount: tournament.prizePool.mvpAmount,
        },
      });
    }

    // Update points for participants
    const POINTS = { CHAMPION: 100, RUNNER_UP: 70, THIRD_PLACE: 30, MVP: 20 };

    // Update champion team members
    if (championTeamId) {
      const teamMembers = await db.teamMember.findMany({
        where: { teamId: championTeamId },
      });
      
      for (const member of teamMembers) {
        const user = await db.user.findUnique({ where: { id: member.userId } });
        if (user) {
          await db.user.update({
            where: { id: member.userId },
            data: { points: user.points + POINTS.CHAMPION },
          });
        }
        
        const globalRank = await db.globalRank.findUnique({ where: { userId: member.userId } });
        if (globalRank) {
          await db.globalRank.update({
            where: { userId: member.userId },
            data: {
              totalPoints: globalRank.totalPoints + POINTS.CHAMPION,
              wins: globalRank.wins + 1,
              tournaments: globalRank.tournaments + 1,
            },
          });
        } else {
          await db.globalRank.create({
            data: {
              userId: member.userId,
              totalPoints: POINTS.CHAMPION,
              wins: 1,
              tournaments: 1,
            },
          });
        }
      }
    }

    // Update runner-up team members
    if (runnerUpTeamId) {
      const teamMembers = await db.teamMember.findMany({
        where: { teamId: runnerUpTeamId },
      });
      
      for (const member of teamMembers) {
        const user = await db.user.findUnique({ where: { id: member.userId } });
        if (user) {
          await db.user.update({
            where: { id: member.userId },
            data: { points: user.points + POINTS.RUNNER_UP },
          });
        }
        
        const globalRank = await db.globalRank.findUnique({ where: { userId: member.userId } });
        if (globalRank) {
          await db.globalRank.update({
            where: { userId: member.userId },
            data: {
              totalPoints: globalRank.totalPoints + POINTS.RUNNER_UP,
              tournaments: globalRank.tournaments + 1,
            },
          });
        } else {
          await db.globalRank.create({
            data: {
              userId: member.userId,
              totalPoints: POINTS.RUNNER_UP,
              tournaments: 1,
            },
          });
        }
      }
    }

    // Update third place team members
    if (thirdPlaceTeamId) {
      const teamMembers = await db.teamMember.findMany({
        where: { teamId: thirdPlaceTeamId },
      });
      
      for (const member of teamMembers) {
        const user = await db.user.findUnique({ where: { id: member.userId } });
        if (user) {
          await db.user.update({
            where: { id: member.userId },
            data: { points: user.points + POINTS.THIRD_PLACE },
          });
        }
        
        const globalRank = await db.globalRank.findUnique({ where: { userId: member.userId } });
        if (globalRank) {
          await db.globalRank.update({
            where: { userId: member.userId },
            data: {
              totalPoints: globalRank.totalPoints + POINTS.THIRD_PLACE,
              tournaments: globalRank.tournaments + 1,
            },
          });
        } else {
          await db.globalRank.create({
            data: {
              userId: member.userId,
              totalPoints: POINTS.THIRD_PLACE,
              tournaments: 1,
            },
          });
        }
      }
    }

    // Update MVP points
    if (mvpId) {
      const user = await db.user.findUnique({ where: { id: mvpId } });
      if (user) {
        await db.user.update({
          where: { id: mvpId },
          data: { points: user.points + POINTS.MVP },
        });
      }
      
      const globalRank = await db.globalRank.findUnique({ where: { userId: mvpId } });
      if (globalRank) {
        await db.globalRank.update({
          where: { userId: mvpId },
          data: { totalPoints: globalRank.totalPoints + POINTS.MVP },
        });
      } else {
        await db.globalRank.create({
          data: {
            userId: mvpId,
            totalPoints: POINTS.MVP,
          },
        });
      }
    }

    // Update tournament status to COMPLETED
    await db.tournament.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    // Send WhatsApp notification for tournament completion
    // Get team and MVP names for notification
    const championTeam = championTeamId 
      ? await db.team.findUnique({ where: { id: championTeamId } }) 
      : null;
    const runnerUpTeam = runnerUpTeamId 
      ? await db.team.findUnique({ where: { id: runnerUpTeamId } }) 
      : null;
    const thirdPlaceTeam = thirdPlaceTeamId 
      ? await db.team.findUnique({ where: { id: thirdPlaceTeamId } }) 
      : null;
    const mvpUser = mvpId 
      ? await db.user.findUnique({ where: { id: mvpId } }) 
      : null;

    await sendWANotification('tournament-finalize', {
      champion: championTeam?.name || 'TBD',
      runnerUp: runnerUpTeam?.name || 'TBD',
      thirdPlace: thirdPlaceTeam?.name,
      mvp: mvpUser?.name || 'TBD',
      tournament: tournament.name,
      division: tournament.division,
      prizePool: tournament.prizePool?.totalAmount 
        ? `Rp ${tournament.prizePool.totalAmount.toLocaleString('id-ID')}` 
        : null,
      link: `https://idolmeta.id/champions`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: champion.id,
        championTeamId: champion.championTeamId,
        runnerUpTeamId: champion.runnerUpTeamId,
        thirdPlaceTeamId: champion.thirdPlaceTeamId,
        mvpId: champion.mvpId,
      },
      message: 'Tournament finalized successfully',
    });
  } catch (error) {
    console.error('Error finalizing tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize tournament' },
      { status: 500 }
    );
  }
}
