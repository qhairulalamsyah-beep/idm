// Tournament Engine V2 - Enhanced with Division-Specific Flows
// Supports Male/Female (individual → team generation) and Liga (pre-formed teams)

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export type Division = 'MALE' | 'FEMALE' | 'LIGA';
export type BracketType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUP_STAGE' | 'SWISS' | 'PLAYOFF';
export type TournamentStatus = 'SETUP' | 'REGISTRATION' | 'APPROVAL' | 'TEAM_GENERATION' | 'BRACKET_GENERATION' | 'IN_PROGRESS' | 'FINALIZATION' | 'COMPLETED' | 'CANCELLED';
export type Tier = 'S' | 'A' | 'B';
export type BracketSide = 'UPPER' | 'LOWER' | 'GRAND_FINAL';

// ============================================
// DIVISION-SPECIFIC CONFIG
// ============================================

export const DIVISION_CONFIG = {
  MALE: {
    teamSize: 3,
    requiresTierBalancing: true,
    allowClubRegistration: false,
    registrationType: 'INDIVIDUAL', // Individuals register, then teams are generated
    description: 'Peserta mendaftar secara individual, admin membentuk tim dengan komposisi S+A+B',
  },
  FEMALE: {
    teamSize: 3,
    requiresTierBalancing: true,
    allowClubRegistration: false,
    registrationType: 'INDIVIDUAL',
    description: 'Peserta mendaftar secara individual, admin membentuk tim dengan komposisi S+A+B',
  },
  LIGA: {
    teamSize: 5,
    requiresTierBalancing: false,
    allowClubRegistration: true,
    registrationType: 'TEAM', // Teams register as a complete unit
    description: 'Club mendaftarkan tim lengkap (5 pemain), tidak ada generate tim',
  },
} as const;

// ============================================
// TOURNAMENT FLOW MANAGER
// ============================================

export class TournamentFlowManager {
  private tournamentId: string;
  private division: Division;

  constructor(tournamentId: string, division: Division) {
    this.tournamentId = tournamentId;
    this.division = division;
  }

  // Get current status and available actions
  async getStatus() {
    const tournament = await db.tournament.findUnique({
      where: { id: this.tournamentId },
      include: {
        registrations: { where: { status: 'APPROVED' } },
        teams: { include: { members: true } },
        bracket: { include: { matches: true, groups: true } },
      },
    });

    if (!tournament) throw new Error('Tournament not found');

    const config = DIVISION_CONFIG[this.division];
    
    return {
      status: tournament.status,
      division: this.division,
      config,
      stats: {
        registrations: tournament.registrations.length,
        teams: tournament.teams.length,
        maxParticipants: tournament.maxParticipants,
        canProgress: this.canProgressToNextStage(tournament),
      },
      availableActions: this.getAvailableActions(tournament),
    };
  }

  private canProgressToNextStage(tournament: {
    status: string;
    registrations: unknown[];
    teams: unknown[];
    maxParticipants: number;
    bracket: { matches: unknown[]; groups: unknown[] } | null;
  }) {
    const config = DIVISION_CONFIG[this.division];
    
    switch (tournament.status) {
      case 'SETUP':
        return true;
      
      case 'REGISTRATION':
        // For Male/Female: need enough participants for teams
        // For Liga: need at least 2 teams registered
        if (this.division === 'LIGA') {
          return tournament.teams.length >= 2;
        }
        return tournament.registrations.length >= config.teamSize;
      
      case 'APPROVAL':
        // Need at least some approved registrations (Male/Female) or teams (Liga)
        if (this.division === 'LIGA') {
          return tournament.teams.length >= 2;
        }
        return tournament.registrations.length >= config.teamSize;
      
      case 'TEAM_GENERATION':
        return tournament.teams.length >= 2;
      
      case 'BRACKET_GENERATION':
        return tournament.bracket !== null && tournament.bracket.matches.length > 0;
      
      case 'IN_PROGRESS':
        // Check if all matches are completed
        return true;
      
      case 'FINALIZATION':
        return true;
      
      default:
        return false;
    }
  }

  private getAvailableActions(tournament: { status: string; registrations: unknown[]; teams: unknown[] }) {
    const actions: string[] = [];
    
    switch (tournament.status) {
      case 'SETUP':
        actions.push('open_registration');
        break;
      
      case 'REGISTRATION':
        actions.push('close_registration', 'start_approval');
        break;
      
      case 'APPROVAL':
        if (this.division !== 'LIGA') {
          actions.push('generate_teams');
        }
        actions.push('proceed_to_bracket');
        break;
      
      case 'TEAM_GENERATION':
        actions.push('generate_bracket');
        break;
      
      case 'BRACKET_GENERATION':
        actions.push('start_tournament');
        break;
      
      case 'IN_PROGRESS':
        actions.push('input_scores', 'finalize_tournament');
        break;
      
      case 'FINALIZATION':
        actions.push('set_champion', 'set_mvp', 'complete_tournament');
        break;
    }
    
    return actions;
  }

  // Progress to next stage
  async progressToNextStage() {
    const status = await this.getStatus();
    
    const transitions: Record<TournamentStatus, TournamentStatus | null> = {
      SETUP: 'REGISTRATION',
      REGISTRATION: 'APPROVAL',
      APPROVAL: this.division === 'LIGA' ? 'BRACKET_GENERATION' : 'TEAM_GENERATION',
      TEAM_GENERATION: 'BRACKET_GENERATION',
      BRACKET_GENERATION: 'IN_PROGRESS',
      IN_PROGRESS: 'FINALIZATION',
      FINALIZATION: 'COMPLETED',
      COMPLETED: null,
      CANCELLED: null,
    };

    const nextStatus = transitions[status.status as TournamentStatus];
    if (!nextStatus) {
      throw new Error('Cannot progress from current status');
    }

    return db.tournament.update({
      where: { id: this.tournamentId },
      data: { status: nextStatus },
    });
  }
}

// ============================================
// SINGLE ELIMINATION BRACKET
// ============================================

// Fisher-Yates shuffle for randomizing team matchups
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generateSingleEliminationBracket(
  tournamentId: string,
  teams: { id: string; name: string }[]
) {
  const numTeams = teams.length;
  const rounds = Math.ceil(Math.log2(numTeams));
  const totalSlots = Math.pow(2, rounds);
  const numByes = totalSlots - numTeams;

  // Create bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'SINGLE_ELIMINATION',
      rounds,
    },
  });

  // Shuffle teams for random matchups
  const seededTeams = shuffleArray(teams);

  let matchNumber = 1;
  const matchIds: string[][] = [];

  // Generate first round
  const firstRoundMatches: { id: string }[] = [];
  for (let i = 0; i < totalSlots / 2; i++) {
    const homeIndex = i;
    const awayIndex = totalSlots - 1 - i;
    
    const homeTeam = homeIndex < numTeams - numByes ? seededTeams[homeIndex] : null;
    const awayTeam = awayIndex < numTeams ? seededTeams[awayIndex] : null;

    // If one team has a bye, they advance automatically
    let winnerId: string | null = null;
    if (homeTeam && !awayTeam) {
      winnerId = homeTeam.id;
    } else if (!homeTeam && awayTeam) {
      winnerId = awayTeam.id;
    }

    const match = await db.match.create({
      data: {
        bracketId: bracket.id,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        status: winnerId ? 'COMPLETED' : 'SCHEDULED',
        winnerId,
        homeScore: winnerId ? 1 : null,
        awayScore: winnerId ? 0 : null,
      },
    });
    
    firstRoundMatches.push(match);
  }
  
  matchIds.push(firstRoundMatches.map(m => m.id));

  // Generate subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const roundMatches: { id: string }[] = [];

    for (let i = 0; i < matchesInRound; i++) {
      const match = await db.match.create({
        data: {
          bracketId: bracket.id,
          tournamentId,
          round,
          matchNumber: matchNumber++,
          status: 'SCHEDULED',
        },
      });
      roundMatches.push(match);
    }
    matchIds.push(roundMatches.map(m => m.id));
  }

  // Link matches (set nextMatchId)
  for (let r = 0; r < matchIds.length - 1; r++) {
    const currentRound = matchIds[r];
    const nextRound = matchIds[r + 1];
    
    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      await db.match.update({
        where: { id: currentRound[i] },
        data: { nextMatchId: nextRound[nextMatchIndex] },
      });
    }
  }

  return bracket;
}

// ============================================
// DOUBLE ELIMINATION BRACKET
// ============================================

export async function generateDoubleEliminationBracket(
  tournamentId: string,
  teams: { id: string; name: string }[]
) {
  const numTeams = teams.length;
  const rounds = Math.ceil(Math.log2(numTeams));
  const totalSlots = Math.pow(2, rounds);

  // Shuffle teams for random matchups
  const shuffledTeams = shuffleArray(teams);

  // Create bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'DOUBLE_ELIMINATION',
      rounds: rounds * 2, // Double the rounds for double elimination
    },
  });

  // Generate Upper Bracket (same as single elimination)
  let matchNumber = 1;
  const upperBracketMatches: string[][] = [];

  // First round upper bracket
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const roundMatches: string[] = [];

    for (let i = 0; i < matchesInRound; i++) {
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;

      if (round === 1) {
        const homeIndex = i * 2;
        const awayIndex = i * 2 + 1;
        homeTeamId = homeIndex < shuffledTeams.length ? shuffledTeams[homeIndex].id : null;
        awayTeamId = awayIndex < shuffledTeams.length ? shuffledTeams[awayIndex].id : null;
      }

      const match = await db.match.create({
        data: {
          bracketId: bracket.id,
          tournamentId,
          round,
          matchNumber: matchNumber++,
          bracketSide: 'UPPER',
          homeTeamId,
          awayTeamId,
          status: 'SCHEDULED',
        },
      });
      roundMatches.push(match.id);
    }
    upperBracketMatches.push(roundMatches);
  }

  // Generate Lower Bracket
  const lowerBracketMatches: string[][] = [];
  
  // Lower bracket has rounds - 1 rounds (teams dropping from upper)
  for (let round = 1; round <= rounds - 1; round++) {
    const matchesInRound = Math.pow(2, rounds - round - 1);
    const roundMatches: string[] = [];

    for (let i = 0; i < matchesInRound; i++) {
      const match = await db.match.create({
        data: {
          bracketId: bracket.id,
          tournamentId,
          round,
          matchNumber: matchNumber++,
          bracketSide: 'LOWER',
          status: 'SCHEDULED',
        },
      });
      roundMatches.push(match.id);
    }
    lowerBracketMatches.push(roundMatches);
  }

  // Grand Final
  const grandFinal = await db.match.create({
    data: {
      bracketId: bracket.id,
      tournamentId,
      round: rounds + 1,
      matchNumber: matchNumber++,
      bracketSide: 'GRAND_FINAL',
      status: 'SCHEDULED',
    },
  });

  // Reset match (if lower bracket winner wins first match)
  const resetMatch = await db.match.create({
    data: {
      bracketId: bracket.id,
      tournamentId,
      round: rounds + 2,
      matchNumber: matchNumber++,
      bracketSide: 'GRAND_FINAL',
      status: 'SCHEDULED',
    },
  });

  return {
    bracket,
    upperBracketMatches,
    lowerBracketMatches,
    grandFinal: grandFinal.id,
    resetMatch: resetMatch.id,
  };
}

// ============================================
// ROUND ROBIN BRACKET
// ============================================

export async function generateRoundRobinBracket(
  tournamentId: string,
  teams: { id: string; name: string }[]
) {
  const numTeams = teams.length;
  const numMatches = (numTeams * (numTeams - 1)) / 2;

  // Create bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'ROUND_ROBIN',
      rounds: numTeams - 1, // Each team plays n-1 matches
    },
  });

  // Create group for standings
  const group = await db.group.create({
    data: {
      bracketId: bracket.id,
      name: 'Standings',
      order: 0,
    },
  });

  // Shuffle teams for random matchups
  const shuffledTeams = shuffleArray(teams);
  
  // Add shuffled teams to group
  for (const team of shuffledTeams) {
    await db.groupMember.create({
      data: {
        groupId: group.id,
        teamId: team.id,
      },
    });
  }

  // Generate all matches with shuffled order
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
  const shuffledMatches = shuffleArray(matchPairs);

  // Distribute matches across rounds evenly
  const matchesPerRound = Math.ceil(numMatches / (numTeams - 1));
  let currentRound = 1;
  let matchesInCurrentRound = 0;
  let matchNumber = 1;

  for (const matchPair of shuffledMatches) {
    await db.match.create({
      data: {
        bracketId: bracket.id,
        tournamentId,
        groupId: group.id,
        round: currentRound,
        matchNumber: matchNumber++,
        homeTeamId: matchPair.home,
        awayTeamId: matchPair.away,
        status: 'SCHEDULED',
      },
    });

    matchesInCurrentRound++;
    if (matchesInCurrentRound >= matchesPerRound) {
      currentRound++;
      matchesInCurrentRound = 0;
    }
  }

  return { bracket, group, totalMatches: numMatches };
}

// ============================================
// GROUP STAGE BRACKET
// ============================================

export async function generateGroupStageBracket(
  tournamentId: string,
  teams: { id: string; name: string }[],
  options: { 
    numGroups?: number;
    teamsPerGroup?: number;
    topAdvance?: number;
  } = {}
) {
  const numGroups = options.numGroups || Math.ceil(teams.length / 4);
  const teamsPerGroup = options.teamsPerGroup || 4;
  const topAdvance = options.topAdvance || 2;

  // Create bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'GROUP_STAGE',
      rounds: 2, // Group stage + Playoff
    },
  });

  // Create groups
  const groups: { id: string; name: string; bracketId: string; order: number }[] = [];
  for (let i = 0; i < numGroups; i++) {
    const group = await db.group.create({
      data: {
        bracketId: bracket.id,
        name: `Group ${String.fromCharCode(65 + i)}`,
        order: i,
      },
    });
    groups.push(group);
  }

  // Shuffle teams for random group assignment
  const shuffledTeams = shuffleArray(teams);

  // Distribute shuffled teams to groups (round-robin distribution)
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
  let matchNumber = 1;
  for (const group of groups) {
    const groupMembers = await db.groupMember.findMany({
      where: { groupId: group.id },
    });
    const groupTeams = groupMembers.map(gm => gm.teamId);

    // Round robin within group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        await db.match.create({
          data: {
            bracketId: bracket.id,
            tournamentId,
            groupId: group.id,
            round: 1, // Group stage round
            matchNumber: matchNumber++,
            homeTeamId: groupTeams[i],
            awayTeamId: groupTeams[j],
            status: 'SCHEDULED',
          },
        });
      }
    }
  }

  return { bracket, groups, topAdvance };
}

// ============================================
// SWISS SYSTEM BRACKET
// ============================================

export async function generateSwissBracket(
  tournamentId: string,
  teams: { id: string; name: string }[],
  options: { numRounds?: number } = {}
) {
  const numRounds = options.numRounds || Math.ceil(Math.log2(teams.length));

  // Create bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'SWISS',
      rounds: numRounds,
    },
  });

  // Create group for standings
  const group = await db.group.create({
    data: {
      bracketId: bracket.id,
      name: 'Swiss Standings',
      order: 0,
    },
  });

  // Add teams to group
  for (const team of teams) {
    await db.groupMember.create({
      data: {
        groupId: group.id,
        teamId: team.id,
      },
    });
  }

  // Generate Round 1 matches (random pairing using Fisher-Yates shuffle)
  const shuffledTeams = shuffleArray(teams);
  let matchNumber = 1;

  for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
    await db.match.create({
      data: {
        bracketId: bracket.id,
        tournamentId,
        groupId: group.id,
        round: 1,
        matchNumber: matchNumber++,
        homeTeamId: shuffledTeams[i].id,
        awayTeamId: shuffledTeams[i + 1]?.id,
        status: 'SCHEDULED',
      },
    });
  }

  // Note: Subsequent rounds are generated dynamically based on results
  // Use generateNextSwissRound() after Round 1 is complete

  return { bracket, group, numRounds };
}

// Generate next Swiss round based on current standings
export async function generateNextSwissRound(bracketId: string, currentRound: number) {
  const bracket = await db.bracket.findUnique({
    where: { id: bracketId },
    include: {
      groups: { include: { members: true } },
      matches: { where: { round: currentRound, status: 'COMPLETED' } },
    },
  });

  if (!bracket) throw new Error('Bracket not found');

  const group = bracket.groups[0];
  if (!group) throw new Error('Group not found');

  // Get team records
  const teamRecords: Map<string, { wins: number; losses: number; teamId: string }> = new Map();

  for (const member of group.members) {
    teamRecords.set(member.teamId, { wins: 0, losses: 0, teamId: member.teamId });
  }

  // Calculate records from completed matches
  for (const match of bracket.matches) {
    if (match.winnerId) {
      const winnerRecord = teamRecords.get(match.winnerId);
      if (winnerRecord) winnerRecord.wins++;
      
      const loserId = match.winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
      const loserRecord = teamRecords.get(loserId || '');
      if (loserRecord) loserRecord.losses++;
    }
  }

  // Group teams by record
  const teamsByRecord: Map<string, string[]> = new Map();
  for (const [teamId, record] of teamRecords) {
    const key = `${record.wins}-${record.losses}`;
    if (!teamsByRecord.has(key)) {
      teamsByRecord.set(key, []);
    }
    teamsByRecord.get(key)!.push(teamId);
  }

  // Pair teams with same record
  const newRound = currentRound + 1;
  let matchNumber = bracket.matches.length + 1;

  for (const [_, teams] of teamsByRecord) {
    // Shuffle teams with same record using Fisher-Yates
    const shuffled = shuffleArray(teams);
    
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      await db.match.create({
        data: {
          bracketId,
          tournamentId: bracket.tournamentId,
          groupId: group.id,
          round: newRound,
          matchNumber: matchNumber++,
          homeTeamId: shuffled[i],
          awayTeamId: shuffled[i + 1],
          status: 'SCHEDULED',
        },
      });
    }
  }

  return { round: newRound };
}

// ============================================
// PLAYOFF BRACKET (After Group Stage)
// ============================================

export async function generatePlayoffBracket(
  tournamentId: string,
  teams: { id: string; name: string; seed: number }[],
  bracketType: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' = 'SINGLE_ELIMINATION'
) {
  // Sort by seed (lower seed = better rank)
  const seededTeams = [...teams].sort((a, b) => a.seed - b.seed);

  // Create playoff bracket
  const bracket = await db.bracket.create({
    data: {
      tournamentId,
      type: 'PLAYOFF',
      rounds: Math.ceil(Math.log2(teams.length)),
    },
  });

  // Generate bracket based on type
  if (bracketType === 'SINGLE_ELIMINATION') {
    // Standard seeding: 1vs8, 2vs7, 3vs6, 4vs5
    const numTeams = seededTeams.length;
    const rounds = Math.ceil(Math.log2(numTeams));
    const totalSlots = Math.pow(2, rounds);

    // Create seeded bracket matches
    let matchNumber = 1;
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        let homeTeamId: string | null = null;
        let awayTeamId: string | null = null;

        if (round === 1) {
          // Apply seeding for first round
          const homeSeed = i + 1;
          const awaySeed = totalSlots - i;
          
          const homeTeam = seededTeams.find(t => t.seed === homeSeed);
          const awayTeam = seededTeams.find(t => t.seed === awaySeed);
          
          homeTeamId = homeTeam?.id || null;
          awayTeamId = awayTeam?.id || null;
        }

        await db.match.create({
          data: {
            bracketId: bracket.id,
            tournamentId,
            round,
            matchNumber: matchNumber++,
            homeTeamId,
            awayTeamId,
            status: 'SCHEDULED',
          },
        });
      }
    }
  }

  return bracket;
}

// ============================================
// MATCH SCORE UPDATE WITH BRACKET PROGRESSION
// ============================================

export async function updateMatchScoreWithProgression(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { bracket: true },
  });

  if (!match) throw new Error('Match not found');

  const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
  const loserId = homeScore > awayScore ? match.awayTeamId : match.homeTeamId;

  // Update match
  const updatedMatch = await db.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      winnerId,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Create match result
  await db.matchResult.create({
    data: {
      matchId,
      winnerId: winnerId!,
      homeScore,
      awayScore,
    },
  });

  // Handle bracket progression based on type
  if (match.bracket?.type === 'SINGLE_ELIMINATION' || match.bracket?.type === 'PLAYOFF') {
    // Advance winner to next match
    if (match.nextMatchId && winnerId) {
      const nextMatch = await db.match.findUnique({
        where: { id: match.nextMatchId },
      });

      if (nextMatch) {
        // Determine if winner goes to home or away slot
        const isHomeSlot = nextMatch.homeTeamId === null;
        await db.match.update({
          where: { id: match.nextMatchId },
          data: isHomeSlot 
            ? { homeTeamId: winnerId }
            : { awayTeamId: winnerId },
        });
      }
    }
  } else if (match.bracket?.type === 'DOUBLE_ELIMINATION') {
    // In double elimination, loser goes to lower bracket
    if (match.bracketSide === 'UPPER' && loserId && match.nextMatchId) {
      // Find the corresponding lower bracket match
      // This requires tracking lower bracket match IDs
      // For now, advance winner to next upper bracket match
      if (match.nextMatchId && winnerId) {
        const nextMatch = await db.match.findUnique({
          where: { id: match.nextMatchId },
        });

        if (nextMatch) {
          const isHomeSlot = nextMatch.homeTeamId === null;
          await db.match.update({
            where: { id: match.nextMatchId },
            data: isHomeSlot 
              ? { homeTeamId: winnerId }
              : { awayTeamId: winnerId },
          });
        }
      }
    }
  } else if (match.bracket?.type === 'ROUND_ROBIN' || match.bracket?.type === 'SWISS') {
    // Update group standings
    if (match.groupId && winnerId) {
      const groupMember = await db.groupMember.findFirst({
        where: { groupId: match.groupId, teamId: winnerId },
      });

      if (groupMember) {
        await db.groupMember.update({
          where: { id: groupMember.id },
          data: {
            points: { increment: 3 },
            wins: { increment: 1 },
          },
        });
      }

      // Update loser record
      if (loserId) {
        const loserMember = await db.groupMember.findFirst({
          where: { groupId: match.groupId, teamId: loserId },
        });

        if (loserMember) {
          await db.groupMember.update({
            where: { id: loserMember.id },
            data: {
              losses: { increment: 1 },
            },
          });
        }
      }

      // Update score difference
      if (match.groupId && match.homeTeamId) {
        await db.groupMember.update({
          where: { groupId_teamId: { groupId: match.groupId, teamId: match.homeTeamId } },
          data: { scoreFor: { increment: homeScore }, scoreAgainst: { increment: awayScore } },
        });
      }
      if (match.groupId && match.awayTeamId) {
        await db.groupMember.update({
          where: { groupId_teamId: { groupId: match.groupId, teamId: match.awayTeamId } },
          data: { scoreFor: { increment: awayScore }, scoreAgainst: { increment: homeScore } },
        });
      }
    }
  }

  return updatedMatch;
}

// ============================================
// TOURNAMENT FINALIZATION
// ============================================

export async function finalizeTournament(
  tournamentId: string,
  data: {
    championTeamId: string;
    runnerUpTeamId: string;
    thirdPlaceTeamId?: string;
    mvpId?: string;
  }
) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { prizePool: true },
  });

  if (!tournament) throw new Error('Tournament not found');

  // Create champion record
  const champion = await db.champion.create({
    data: {
      tournamentId,
      championTeamId: data.championTeamId,
      runnerUpTeamId: data.runnerUpTeamId,
      thirdPlaceTeamId: data.thirdPlaceTeamId,
      mvpId: data.mvpId,
    },
  });

  // Award MVP prize if set
  if (data.mvpId && tournament.prizePool) {
    await db.mVPAward.create({
      data: {
        userId: data.mvpId,
        tournamentId,
        prizeAmount: tournament.prizePool.mvpAmount,
      },
    });
  }

  // Update tournament status
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: 'COMPLETED' },
  });

  // Update global rankings
  await updateGlobalRankings(tournamentId, data);

  return champion;
}

async function updateGlobalRankings(
  tournamentId: string,
  results: {
    championTeamId: string;
    runnerUpTeamId: string;
    thirdPlaceTeamId?: string;
    mvpId?: string;
  }
) {
  const POINTS = {
    CHAMPION: 100,
    RUNNER_UP: 70,
    THIRD_PLACE: 30,
    TOP_8: 10,
    MVP: 20,
  };

  // Get team members and award points
  const championTeam = await db.team.findUnique({
    where: { id: results.championTeamId },
    include: { members: true },
  });

  if (championTeam) {
    for (const member of championTeam.members) {
      await db.globalRank.upsert({
        where: { userId: member.userId },
        update: {
          totalPoints: { increment: POINTS.CHAMPION },
          wins: { increment: 1 },
          tournaments: { increment: 1 },
        },
        create: {
          userId: member.userId,
          totalPoints: POINTS.CHAMPION,
          wins: 1,
          tournaments: 1,
        },
      });
    }
  }

  // Similar for runner-up and third place...
  // (Implementation continues for other positions)

  return true;
}
