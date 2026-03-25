// Tournament Engine - Core Logic
// Handles tournament creation, team generation, and bracket management

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export type Division = 'MALE' | 'FEMALE';
export type BracketType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUP_STAGE' | 'SWISS' | 'PLAYOFF';
export type TournamentStatus = 'SETUP' | 'REGISTRATION' | 'APPROVAL' | 'TEAM_GENERATION' | 'BRACKET_GENERATION' | 'IN_PROGRESS' | 'FINALIZATION' | 'COMPLETED' | 'CANCELLED';
export type Tier = 'S' | 'A' | 'B';

export interface CreateTournamentInput {
  name: string;
  division: Division;
  mode: string;
  bpm: string;
  bracketType: BracketType;
  maxParticipants: number;
  startDate: Date;
  location?: string;
  rules?: string;
}

export interface TeamComposition {
  teamId: string;
  members: { id: string; name: string; tier: Tier }[];
}

// ============================================
// TOURNAMENT CRUD
// ============================================

export async function createTournament(input: CreateTournamentInput) {
  const tournament = await db.tournament.create({
    data: {
      name: input.name,
      division: input.division,
      mode: input.mode,
      bpm: input.bpm,
      bracketType: input.bracketType,
      maxParticipants: input.maxParticipants,
      startDate: input.startDate,
      location: input.location,
      rules: input.rules,
      status: 'SETUP',
    },
  });

  // Create prize pool
  await db.prizePool.create({
    data: {
      tournamentId: tournament.id,
      championAmount: 0,
      runnerUpAmount: 0,
      thirdPlaceAmount: 0,
      mvpAmount: 0,
      totalAmount: 0,
    },
  });

  return tournament;
}

export async function getTournaments(division?: Division) {
  const where = division ? { division } : {};
  return db.tournament.findMany({
    where,
    include: {
      prizePool: true,
      _count: {
        select: { registrations: true, teams: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });
}

export async function getTournamentById(id: string) {
  return db.tournament.findUnique({
    where: { id },
    include: {
      prizePool: {
        include: {
          saweran: {
            where: { status: 'COMPLETED' },
          },
        },
      },
      registrations: {
        include: { user: true },
      },
      teams: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
      bracket: {
        include: {
          matches: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
          groups: {
            include: {
              members: {
                include: { team: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function updateTournamentStatus(id: string, status: TournamentStatus) {
  return db.tournament.update({
    where: { id },
    data: { status },
  });
}

// ============================================
// REGISTRATION
// ============================================

export async function registerParticipant(
  tournamentId: string,
  userId: string,
  division: Division,
  tier?: Tier
) {
  // Check if tournament exists and is open for registration
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { registrations: true } } },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== 'REGISTRATION' && tournament.status !== 'APPROVAL') {
    throw new Error('Tournament is not open for registration');
  }

  if (tournament._count.registrations >= tournament.maxParticipants) {
    throw new Error('Tournament is full');
  }

  // Check if already registered
  const existing = await db.registration.findUnique({
    where: {
      tournamentId_userId: { tournamentId, userId },
    },
  });

  if (existing) {
    throw new Error('Already registered');
  }

  return db.registration.create({
    data: {
      tournamentId,
      userId,
      division,
      tier,
      status: 'PENDING',
    },
  });
}

export async function approveRegistration(registrationId: string, tier: Tier, adminId: string) {
  return db.registration.update({
    where: { id: registrationId },
    data: {
      status: 'APPROVED',
      tier,
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function getPendingRegistrations(tournamentId: string) {
  return db.registration.findMany({
    where: { tournamentId, status: 'PENDING' },
    include: { user: true },
  });
}

// ============================================
// TEAM GENERATION ENGINE
// ============================================

export async function generateTeams(tournamentId: string): Promise<TeamComposition[]> {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        where: { status: 'APPROVED' },
        include: { user: true },
      },
    },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const participants = tournament.registrations.map((r) => ({
    id: r.userId,
    name: r.user.name || 'Unknown',
    tier: r.tier || 'B',
  }));

  // Separate by tier
  let tierS = participants.filter((p) => p.tier === 'S');
  let tierA = participants.filter((p) => p.tier === 'A');
  let tierB = participants.filter((p) => p.tier === 'B');

  // Calculate number of teams (3 players per team)
  const teamSize = 3;
  const numTeams = Math.floor(participants.length / teamSize);

  const teams: TeamComposition[] = [];

  for (let i = 0; i < numTeams; i++) {
    const teamMembers: { id: string; name: string; tier: Tier }[] = [];

    // Pick one from each tier if available
    // Try to pick from S tier
    if (tierS.length > 0) {
      const idx = Math.floor(Math.random() * tierS.length);
      teamMembers.push(tierS.splice(idx, 1)[0]);
    }
    // Try to pick from A tier
    if (tierA.length > 0 && teamMembers.length < teamSize) {
      const idx = Math.floor(Math.random() * tierA.length);
      teamMembers.push(tierA.splice(idx, 1)[0]);
    }
    // Try to pick from B tier
    if (tierB.length > 0 && teamMembers.length < teamSize) {
      const idx = Math.floor(Math.random() * tierB.length);
      teamMembers.push(tierB.splice(idx, 1)[0]);
    }
    
    // Fill remaining slots from any available tier
    while (teamMembers.length < teamSize) {
      if (tierS.length > 0) {
        const idx = Math.floor(Math.random() * tierS.length);
        teamMembers.push(tierS.splice(idx, 1)[0]);
      } else if (tierA.length > 0) {
        const idx = Math.floor(Math.random() * tierA.length);
        teamMembers.push(tierA.splice(idx, 1)[0]);
      } else if (tierB.length > 0) {
        const idx = Math.floor(Math.random() * tierB.length);
        teamMembers.push(tierB.splice(idx, 1)[0]);
      } else {
        break; // No more participants available
      }
    }

    if (teamMembers.length === teamSize) {
      // Generate team name based on tier S player (if exists)
      // Find tier S player in the team
      const tierSPlayer = teamMembers.find(m => m.tier === 'S');
      const teamName = tierSPlayer 
        ? `${tierSPlayer.name}'s Team` 
        : teamMembers[0] 
          ? `${teamMembers[0].name}'s Team`
          : `Team ${i + 1}`;
      
      // Create team in database
      const team = await db.team.create({
        data: {
          tournamentId,
          name: teamName,
          isGenerated: true,
          members: {
            create: teamMembers.map((m, idx) => ({
              userId: m.id,
              isCaptain: idx === 0,
            })),
          },
        },
      });

      teams.push({
        teamId: team.id,
        members: teamMembers,
      });
    }
  }

  // Update tournament status
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: 'TEAM_GENERATION' },
  });

  return teams;
}

// ============================================
// BRACKET GENERATION ENGINE
// Updated: handles existing bracket deletion
// ============================================

export async function generateBracket(tournamentId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: true,
      bracket: true,
    },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Check if tournament has teams
  if (tournament.teams.length === 0) {
    throw new Error('Tournament has no teams. Generate teams first.');
  }

  // Delete existing bracket if exists
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

  const teams = tournament.teams;
  const numTeams = teams.length;

  // Create bracket using connect syntax for Prisma 6 compatibility
  // rounds will be updated after matches are generated
  const bracket = await db.bracket.create({
    data: {
      type: tournament.bracketType,
      rounds: 0, // SQLite doesn't support -Infinity for Int, use 0 as placeholder
      tournament: {
        connect: { id: tournamentId }
      }
    }
  });

  switch (tournament.bracketType) {
    case 'SINGLE_ELIMINATION':
      await generateSingleElimination(bracket.id, teams, tournamentId);
      break;
    case 'DOUBLE_ELIMINATION':
      await generateDoubleElimination(bracket.id, teams, tournamentId);
      break;
    case 'ROUND_ROBIN':
      await generateRoundRobin(bracket.id, teams, tournamentId);
      break;
    case 'GROUP_STAGE':
      await generateGroupStage(bracket.id, teams, numTeams, tournamentId);
      break;
    default:
      await generateSingleElimination(bracket.id, teams, tournamentId);
  }

  // Calculate actual rounds and update bracket
  const actualRounds = Math.ceil(Math.log2(Math.max(1, numTeams)));
  await db.bracket.update({
    where: { id: bracket.id },
    data: { rounds: actualRounds },
  });

  // Update tournament status
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: 'BRACKET_GENERATION' },
  });

  return bracket;
}

// Fisher-Yates shuffle algorithm for randomizing team matchups
function shuffleTeams<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function generateSingleElimination(bracketId: string, teams: { id: string }[], tournamentId: string) {
  const numTeams = teams.length;
  const rounds = Math.ceil(Math.log2(numTeams));
  
  // Shuffle teams for random matchups
  const shuffledTeams = shuffleTeams(teams);
  
  // Store match IDs for linking
  const matchIds: string[][] = [];
  let matchNumber = 1;

  // First round matches
  const firstRoundMatches = Math.pow(2, rounds - 1);
  const firstRoundMatchIds: string[] = [];

  for (let i = 0; i < firstRoundMatches; i++) {
    const homeTeam = shuffledTeams[i * 2];
    const awayTeam = shuffledTeams[i * 2 + 1];

    const match = await db.match.create({
      data: {
        bracketId,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        status: 'SCHEDULED',
      },
    });
    firstRoundMatchIds.push(match.id);
  }
  matchIds.push(firstRoundMatchIds);

  // Create subsequent rounds and link matches
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const currentRoundMatchIds: string[] = [];
    const prevRoundMatchIds = matchIds[round - 2];

    for (let i = 0; i < matchesInRound; i++) {
      // Get the two matches from previous round that feed into this match
      const homeMatchId = prevRoundMatchIds[i * 2];
      const awayMatchId = prevRoundMatchIds[i * 2 + 1];

      const match = await db.match.create({
        data: {
          bracketId,
          tournamentId,
          round,
          matchNumber: matchNumber++,
          status: 'SCHEDULED',
        },
      });
      currentRoundMatchIds.push(match.id);

      // Update previous round matches to point to this match
      await db.match.update({
        where: { id: homeMatchId },
        data: { nextMatchId: match.id },
      });
      await db.match.update({
        where: { id: awayMatchId },
        data: { nextMatchId: match.id },
      });
    }
    matchIds.push(currentRoundMatchIds);
  }
}

async function generateDoubleElimination(bracketId: string, teams: { id: string }[], tournamentId: string) {
  const numTeams = teams.length;
  const rounds = Math.ceil(Math.log2(numTeams));
  
  // Shuffle teams for random matchups
  const shuffledTeams = shuffleTeams(teams);
  
  // Store match IDs for linking
  const upperBracketMatchIds: string[][] = [];
  const lowerBracketMatchIds: string[][] = [];
  let matchNumber = 1;

  // === UPPER BRACKET ===
  // First round matches - all teams play here
  const firstRoundMatches = Math.pow(2, rounds - 1);
  const firstRoundMatchIds: string[] = [];

  for (let i = 0; i < firstRoundMatches; i++) {
    const homeTeam = shuffledTeams[i * 2];
    const awayTeam = shuffledTeams[i * 2 + 1];

    const match = await db.match.create({
      data: {
        bracketId,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        bracketSide: 'UPPER',
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        status: 'SCHEDULED',
      },
    });
    firstRoundMatchIds.push(match.id);
  }
  upperBracketMatchIds.push(firstRoundMatchIds);

  // Create subsequent upper bracket rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const currentRoundMatchIds: string[] = [];
    const prevRoundMatchIds = upperBracketMatchIds[round - 2];

    for (let i = 0; i < matchesInRound; i++) {
      const homeMatchId = prevRoundMatchIds[i * 2];
      const awayMatchId = prevRoundMatchIds[i * 2 + 1];

      const match = await db.match.create({
        data: {
          bracketId,
          tournamentId,
          round,
          matchNumber: matchNumber++,
          bracketSide: 'UPPER',
          status: 'SCHEDULED',
        },
      });
      currentRoundMatchIds.push(match.id);

      // Link matches - winner advances, with slot positions
      // homeMatch winner goes to home position (slot 0)
      // awayMatch winner goes to away position (slot 1)
      await db.match.update({
        where: { id: homeMatchId },
        data: { nextMatchId: match.id, winnerSlot: 0 },
      });
      await db.match.update({
        where: { id: awayMatchId },
        data: { nextMatchId: match.id, winnerSlot: 1 },
      });
    }
    upperBracketMatchIds.push(currentRoundMatchIds);
  }

  // === LOWER BRACKET ===
  // For 8 teams: 
  // LB R1: 2 matches - Losers from UB R1 (M1 vs M2 losers, M3 vs M4 losers)
  // LB R2: 2 matches - Winners from LB R1 vs Losers from UB R2
  // LB R3: 1 match - Winner from LB R2 vs Loser from UB R3 (semifinal)
  // LB R4: 1 match - Winner from LB R3 vs Loser from UB Final
  
  // LB Round 1 - losers from UB Round 1 face each other
  const lbRound1Matches: string[] = [];
  const ubRound1Matches = upperBracketMatchIds[0];
  for (let i = 0; i < ubRound1Matches.length; i += 2) {
    const match = await db.match.create({
      data: {
        bracketId,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        bracketSide: 'LOWER',
        status: 'SCHEDULED',
      },
    });
    lbRound1Matches.push(match.id);
    
    // Set loserMatchId for UB matches with specific slot positions
    // First UB match loser goes to home position (slot 0)
    // Second UB match loser goes to away position (slot 1)
    await db.match.update({
      where: { id: ubRound1Matches[i] },
      data: { loserMatchId: match.id, loserSlot: 0 },
    });
    await db.match.update({
      where: { id: ubRound1Matches[i + 1] },
      data: { loserMatchId: match.id, loserSlot: 1 },
    });
  }
  lowerBracketMatchIds.push(lbRound1Matches);

  // LB Round 2 - winners from LB R1 face losers from UB R2
  const lbRound2Matches: string[] = [];
  const ubRound2Matches = upperBracketMatchIds[1];
  for (let i = 0; i < (ubRound2Matches?.length || 0); i++) {
    const match = await db.match.create({
      data: {
        bracketId,
        tournamentId,
        round: 2,
        matchNumber: matchNumber++,
        bracketSide: 'LOWER',
        status: 'SCHEDULED',
      },
    });
    lbRound2Matches.push(match.id);
    
    // Link from LB R1 (winner advances to home position)
    const lbR1MatchIndex = Math.floor(i / 2);
    if (lbRound1Matches[lbR1MatchIndex]) {
      await db.match.update({
        where: { id: lbRound1Matches[lbR1MatchIndex] },
        data: { nextMatchId: match.id, winnerSlot: i % 2 }, // alternate home/away
      });
    }
    
    // Set loserMatchId for UB R2 matches - loser goes to away position
    await db.match.update({
      where: { id: ubRound2Matches[i] },
      data: { loserMatchId: match.id, loserSlot: 1 }, // UB R2 loser always to away
    });
  }
  lowerBracketMatchIds.push(lbRound2Matches);

  // LB Round 3 - winner from LB R2 faces loser from UB R3 (upper semi-final)
  const lbRound3Matches: string[] = [];
  const ubRound3Matches = upperBracketMatchIds[2];
  if (ubRound3Matches && ubRound3Matches.length > 0) {
    for (let i = 0; i < ubRound3Matches.length; i++) {
      const match = await db.match.create({
        data: {
          bracketId,
          tournamentId,
          round: 3,
          matchNumber: matchNumber++,
          bracketSide: 'LOWER',
          status: 'SCHEDULED',
        },
      });
      lbRound3Matches.push(match.id);
      
      // Link from LB R2 (winner advances to home position)
      if (lbRound2Matches[i]) {
        await db.match.update({
          where: { id: lbRound2Matches[i] },
          data: { nextMatchId: match.id, winnerSlot: 0 },
        });
      }
      
      // Set loserMatchId for UB R3 matches - loser goes to away position
      await db.match.update({
        where: { id: ubRound3Matches[i] },
        data: { loserMatchId: match.id, loserSlot: 1 },
      });
    }
  }
  lowerBracketMatchIds.push(lbRound3Matches);

  // LB Round 4 - Lower bracket final (winner of LB R3 vs loser of UB final)
  const lbRound4Match = await db.match.create({
    data: {
      bracketId,
      tournamentId,
      round: 4,
      matchNumber: matchNumber++,
      bracketSide: 'LOWER',
      status: 'SCHEDULED',
    },
  });
  
  // Link from LB R3 (winner advances to home position)
  if (lbRound3Matches.length > 0) {
    await db.match.update({
      where: { id: lbRound3Matches[0] },
      data: { nextMatchId: lbRound4Match.id, winnerSlot: 0 },
    });
  }
  
  // Set loserMatchId for UB final (last match in upper bracket) - loser to away
  const ubFinalMatch = upperBracketMatchIds[upperBracketMatchIds.length - 1][0];
  await db.match.update({
    where: { id: ubFinalMatch },
    data: { loserMatchId: lbRound4Match.id, loserSlot: 1 },
  });
  
  lowerBracketMatchIds.push([lbRound4Match.id]);

  // === GRAND FINAL ===
  const grandFinal = await db.match.create({
    data: {
      bracketId,
      tournamentId,
      round: rounds + 1,
      matchNumber: matchNumber,
      bracketSide: 'GRAND_FINAL',
      status: 'SCHEDULED',
    },
  });

  // Link UB final winner to home position
  await db.match.update({
    where: { id: ubFinalMatch },
    data: { nextMatchId: grandFinal.id, winnerSlot: 0 },
  });
  // Link LB final winner to away position
  await db.match.update({
    where: { id: lbRound4Match.id },
    data: { nextMatchId: grandFinal.id, winnerSlot: 1 },
  });
}

async function generateRoundRobin(bracketId: string, teams: { id: string }[], tournamentId: string) {
  // Shuffle teams for random matchups
  const shuffledTeams = shuffleTeams(teams);
  
  // Generate all possible matches with shuffled order
  const matchPairs: { home: string; away: string }[] = [];
  for (let i = 0; i < shuffledTeams.length; i++) {
    for (let j = i + 1; j < shuffledTeams.length; j++) {
      // Randomly decide which team is home/away
      const isHomeFirst = Math.random() > 0.5;
      matchPairs.push({
        home: isHomeFirst ? shuffledTeams[i].id : shuffledTeams[j].id,
        away: isHomeFirst ? shuffledTeams[j].id : shuffledTeams[i].id,
      });
    }
  }
  
  // Shuffle the match order as well for more randomness
  const shuffledMatches = shuffleTeams(matchPairs);
  
  let matchNumber = 1;
  for (const match of shuffledMatches) {
    await db.match.create({
      data: {
        bracketId,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        homeTeamId: match.home,
        awayTeamId: match.away,
        status: 'SCHEDULED',
      },
    });
  }
}

async function generateGroupStage(bracketId: string, teams: { id: string }[], numTeams: number, tournamentId: string) {
  const numGroups = Math.ceil(numTeams / 4); // 4 teams per group

  // Shuffle teams for random group assignment
  const shuffledTeams = shuffleTeams(teams);

  // Create groups
  const groups: { id: string; name: string }[] = [];
  for (let i = 0; i < numGroups; i++) {
    const group = await db.group.create({
      data: {
        bracketId,
        name: `Group ${String.fromCharCode(65 + i)}`,
        order: i,
      },
    });
    groups.push({ id: group.id, name: group.name });
  }

  // Assign shuffled teams to groups (snake draft pattern for balance)
  for (let i = 0; i < shuffledTeams.length; i++) {
    const groupIndex = i % numGroups;
    await db.groupMember.create({
      data: {
        groupId: groups[groupIndex].id,
        teamId: shuffledTeams[i].id,
      },
    });
  }

  // Generate round robin matches for each group
  for (const group of groups) {
    const groupMembers = await db.groupMember.findMany({
      where: { groupId: group.id },
      include: { team: true },
    });

    const groupTeams = groupMembers.map((gm) => ({ id: gm.teamId }));

    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        await db.match.create({
          data: {
            bracketId,
            tournamentId,
            groupId: group.id,
            round: 1,
            matchNumber: 1,
            homeTeamId: groupTeams[i].id,
            awayTeamId: groupTeams[j].id,
            status: 'SCHEDULED',
          },
        });
      }
    }
  }
}

// ============================================
// MATCH MANAGEMENT
// ============================================

export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { bracket: true },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Skip if match is already completed with same score
  if (match.status === 'COMPLETED' && match.homeScore === homeScore && match.awayScore === awayScore) {
    console.log('Match already completed with same score, skipping');
    return match;
  }

  const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
  const loserId = homeScore > awayScore ? match.awayTeamId : match.homeTeamId;

  console.log('updateMatchScore called:', {
    matchId,
    homeScore,
    awayScore,
    winnerId,
    loserId,
    bracketType: match.bracket?.type,
    bracketSide: match.bracketSide,
    loserMatchId: match.loserMatchId,
    loserSlot: match.loserSlot,
    nextMatchId: match.nextMatchId,
    winnerSlot: match.winnerSlot
  });

  // Use transaction for atomic updates
  const result = await db.$transaction(async (tx) => {
    // Update match
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        winnerId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Upsert match result
    await tx.matchResult.upsert({
      where: { matchId },
      update: {
        winnerId: winnerId!,
        homeScore,
        awayScore,
      },
      create: {
        matchId,
        winnerId: winnerId!,
        homeScore,
        awayScore,
      },
    });

    // Handle bracket progression based on bracket type
    if (match.bracket?.type === 'DOUBLE_ELIMINATION') {
      console.log('Processing DOUBLE_ELIMINATION progression...');
      
      // Advance winner to next match using winnerSlot for position
      if (match.nextMatchId && winnerId) {
        // Use winnerSlot to determine position (0 = home, 1 = away)
        const updateData = match.winnerSlot === 0 
          ? { homeTeamId: winnerId } 
          : { awayTeamId: winnerId };
        
        console.log('Updating next match with winner:', { 
          nextMatchId: match.nextMatchId, 
          winnerSlot: match.winnerSlot,
          updateData 
        });
        
        await tx.match.update({
          where: { id: match.nextMatchId },
          data: updateData,
        });
      }
      
      // Send loser to lower bracket using loserSlot for position
      if (match.bracketSide === 'UPPER' && match.loserMatchId && loserId) {
        // Use loserSlot to determine position (0 = home, 1 = away)
        const updateData = match.loserSlot === 0 
          ? { homeTeamId: loserId } 
          : { awayTeamId: loserId };
        
        console.log('Updating loser match with loser:', { 
          loserMatchId: match.loserMatchId, 
          loserSlot: match.loserSlot,
          updateData 
        });
        
        await tx.match.update({
          where: { id: match.loserMatchId },
          data: updateData,
        });
      }
    } else {
      // Single elimination or other formats: only winner advances
      if (match.nextMatchId && winnerId) {
        // Use winnerSlot if available, otherwise use fallback logic
        const updateData = match.winnerSlot !== null && match.winnerSlot !== undefined
          ? (match.winnerSlot === 0 ? { homeTeamId: winnerId } : { awayTeamId: winnerId })
          : (!await tx.match.findUnique({ where: { id: match.nextMatchId } }).then(m => m?.homeTeamId))
            ? { homeTeamId: winnerId }
            : { awayTeamId: winnerId };
        
        await tx.match.update({
          where: { id: match.nextMatchId },
          data: updateData,
        });
      }
    }

    return updatedMatch;
  });

  return result;
}
