import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePlayoffBracket } from '@/lib/tournament/engine-v2';

// POST /api/brackets/playoff - Generate playoff bracket from group stage results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, topAdvance = 2 } = body;

    // Get tournament with group stage results
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        bracket: {
          include: {
            groups: {
              include: {
                members: {
                  include: { team: true },
                },
              },
            },
            matches: {
              where: { status: 'COMPLETED' },
            },
          },
        },
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.bracket || tournament.bracket.type !== 'GROUP_STAGE') {
      return NextResponse.json(
        { success: false, error: 'Tournament must have GROUP_STAGE bracket' },
        { status: 400 }
      );
    }

    // Check if all group stage matches are completed
    const totalGroupMatches = await db.match.count({
      where: {
        bracketId: tournament.bracket.id,
        groupId: { not: null },
        status: { not: 'COMPLETED' },
      },
    });

    if (totalGroupMatches > 0) {
      return NextResponse.json(
        { success: false, error: `Still ${totalGroupMatches} group stage matches not completed` },
        { status: 400 }
      );
    }

    // Calculate group standings and get top teams
    const playoffTeams: { id: string; name: string; seed: number }[] = [];
    let seedCounter = 1;

    for (const group of tournament.bracket.groups) {
      // Sort members by points, then wins, then score difference
      const sortedMembers = group.members.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        const aDiff = a.scoreFor - a.scoreAgainst;
        const bDiff = b.scoreFor - b.scoreAgainst;
        return bDiff - aDiff;
      });

      // Take top teams from each group
      for (let i = 0; i < Math.min(topAdvance, sortedMembers.length); i++) {
        const member = sortedMembers[i];
        if (member.team) {
          playoffTeams.push({
            id: member.teamId,
            name: member.team.name,
            seed: seedCounter++,
          });
        }
      }
    }

    if (playoffTeams.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough teams for playoff' },
        { status: 400 }
      );
    }

    // Generate playoff bracket
    const playoffBracket = await generatePlayoffBracket(
      tournamentId,
      playoffTeams,
      'SINGLE_ELIMINATION'
    );

    // Update tournament status
    await db.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS' },
    });

    return NextResponse.json({
      success: true,
      data: {
        bracket: playoffBracket,
        teams: playoffTeams,
        message: `Playoff bracket generated with ${playoffTeams.length} teams`,
      },
    });
  } catch (error) {
    console.error('Error generating playoff bracket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate playoff bracket' },
      { status: 500 }
    );
  }
}
