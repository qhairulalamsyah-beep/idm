#!/usr/bin/env bun
/**
 * Tournament Auto-Test Script
 * Runs automated tests for the tournament system in parallel
 * Saves results to JSON files for analysis
 */

import { config, TestMode } from './config';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface TestResult {
  mode: TestMode;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  matches: Array<{
    matchId: string;
    round: number;
    homeTeam: string;
    awayTeam: string;
    scoreA: number;
    scoreB: number;
  }>;
  champion: {
    teamId: string;
    teamName: string;
    members: string[];
  } | null;
  tournament: {
    id: string;
    name: string;
    division: string;
  } | null;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  duration: number | null;
}

interface Player {
  id: string;
  name: string;
  tier: 'S' | 'A' | 'B';
}

interface Team {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    user: { name: string };
  }>;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface Bracket {
  id: string;
  matches: Match[];
}

const RESULTS_DIR = path.join(__dirname, 'results');

// Helper functions
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const log = (msg: string) => console.log(`[TEST] ${msg}`);

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let i = 0; i < config.RETRY_LIMIT; i++) {
    try {
      return await fn();
    } catch (err) {
      log(`⚠️ Retry ${label} (${i + 1}/${config.RETRY_LIMIT})`);
      await delay(1000);
    }
  }
  throw new Error(`❌ Failed after ${config.RETRY_LIMIT} retries: ${label}`);
}

function randomScore(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function createResultTemplate(mode: TestMode): TestResult {
  return {
    mode,
    status: 'RUNNING',
    matches: [],
    champion: null,
    tournament: null,
    error: null,
    startedAt: new Date(),
    finishedAt: null,
    duration: null,
  };
}

// API helper with proper error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: string }> {
  const url = `${config.BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// ==============================
// CORE TEST STEPS
// ==============================

async function createTournament(mode: TestMode): Promise<{ id: string; name: string }> {
  const bracketTypeMap: Record<TestMode, string> = {
    SINGLE: 'SINGLE_ELIMINATION',
    DOUBLE: 'DOUBLE_ELIMINATION',
    ROUND_ROBIN: 'ROUND_ROBIN',
    GROUP_STAGE: 'GROUP_STAGE',
  };

  const response = await retry(
    () =>
      apiCall<{ id: string; name: string }>('/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          name: `Auto-Test ${mode} ${Date.now()}`,
          division: config.DIVISION,
          mode: config.TOURNAMENT.mode,
          bpm: config.TOURNAMENT.bpm,
          bracketType: bracketTypeMap[mode],
          maxParticipants: config.TOURNAMENT.maxParticipants,
          startDate: new Date().toISOString(),
          location: config.TOURNAMENT.location,
        }),
      }),
    'create tournament'
  );

  return response.data;
}

async function updateTournamentStatus(tournamentId: string, status: string): Promise<void> {
  await retry(
    () =>
      apiCall(`/tournaments/${tournamentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    'update tournament status'
  );
}

async function registerPlayers(tournamentId: string): Promise<Player[]> {
  const players: Player[] = [];
  const tiers: Array<'S' | 'A' | 'B'> = ['S', 'A', 'B'];

  for (let i = 1; i <= config.TOTAL_PLAYERS; i++) {
    const tier = tiers[i % 3];

    const response = await retry(
      () =>
        apiCall<{ id: string; name: string; tier: string }>('/registrations', {
          method: 'POST',
          body: JSON.stringify({
            tournamentId,
            name: `${config.PLAYER_PREFIX}_${i}_${Date.now()}`,
            phone: `+6281234567${String(i).padStart(3, '0')}`,
            division: config.DIVISION,
          }),
        }),
      `register player ${i}`
    );

    players.push({
      id: response.data.id,
      name: response.data.name,
      tier: tier,
    });

    await delay(100);
  }

  return players;
}

async function approveAllRegistrations(tournamentId: string): Promise<void> {
  // Get all pending registrations
  const response = await retry(
    () =>
      apiCall<Array<{ id: string; status: string }>>(
        `/registrations?tournamentId=${tournamentId}&status=PENDING`
      ),
    'get pending registrations'
  );

  const registrations = response.data;
  const tiers: Array<'S' | 'A' | 'B'> = ['S', 'A', 'B'];

  // Approve each registration with tier assignment
  for (let i = 0; i < registrations.length; i++) {
    const tier = tiers[i % 3];
    await retry(
      () =>
        apiCall(`/registrations/${registrations[i].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'APPROVED',
            tier,
          }),
        }),
      `approve registration ${i + 1}`
    );
    await delay(50);
  }
}

async function generateTeams(tournamentId: string): Promise<Team[]> {
  const response = await retry(
    () =>
      apiCall<Team[]>('/teams', {
        method: 'POST',
        body: JSON.stringify({
          tournamentId,
          generate: true,
        }),
      }),
    'generate teams'
  );

  return response.data;
}

async function generateBracket(tournamentId: string): Promise<Bracket> {
  const response = await retry(
    () =>
      apiCall<Bracket>('/brackets', {
        method: 'POST',
        body: JSON.stringify({ tournamentId }),
      }),
    'generate bracket'
  );

  return response.data;
}

async function getBracket(tournamentId: string): Promise<Bracket | null> {
  const response = await retry(
    () => apiCall<Bracket[]>(`/brackets?tournamentId=${tournamentId}`),
    'get bracket'
  );

  return response.data[0] || null;
}

async function getMatches(tournamentId: string): Promise<Match[]> {
  const bracket = await getBracket(tournamentId);
  if (!bracket) return [];

  return bracket.matches.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.matchNumber - b.matchNumber;
  });
}

async function simulateMatch(match: Match, result: TestResult): Promise<void> {
  const scoreA = randomScore();
  const scoreB = randomScore();

  if (!match.homeTeamId || !match.awayTeamId) {
    return; // Skip matches without teams
  }

  await retry(
    () =>
      apiCall(`/matches/${match.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          homeScore: scoreA,
          awayScore: scoreB,
        }),
      }),
    `update match ${match.matchNumber}`
  );

  result.matches.push({
    matchId: match.id,
    round: match.round,
    homeTeam: match.homeTeam?.name || 'TBD',
    awayTeam: match.awayTeam?.name || 'TBD',
    scoreA,
    scoreB,
  });

  await delay(config.DELAY);
}

async function simulateTournament(
  tournamentId: string,
  result: TestResult
): Promise<void> {
  // Get all matches
  let matches = await getMatches(tournamentId);

  // Simulate matches round by round
  const maxRounds = Math.max(...matches.map((m) => m.round));

  for (let round = 1; round <= maxRounds; round++) {
    const roundMatches = matches.filter((m) => m.round === round);

    for (const match of roundMatches) {
      // Wait a bit for bracket to update
      await delay(200);

      // Refresh match data
      const freshMatches = await getMatches(tournamentId);
      const freshMatch = freshMatches.find((m) => m.id === match.id);

      if (freshMatch && freshMatch.homeTeamId && freshMatch.awayTeamId) {
        await simulateMatch(freshMatch, result);
      }
    }

    // Refresh matches for next round
    matches = await getMatches(tournamentId);
  }
}

async function getTournamentChampion(
  tournamentId: string,
  teams: Team[]
): Promise<{ teamId: string; teamName: string; members: string[] } | null> {
  const response = await retry(
    () => apiCall<{ champion: { championTeamId: string } | null }>(`/tournaments/${tournamentId}`),
    'get tournament champion'
  );

  if (response.data.champion?.championTeamId) {
    const championTeam = teams.find((t) => t.id === response.data.champion!.championTeamId);
    if (championTeam) {
      return {
        teamId: championTeam.id,
        teamName: championTeam.name,
        members: championTeam.members.map((m) => m.user.name),
      };
    }
  }

  // If no champion set, find the last match winner
  const matches = await getMatches(tournamentId);
  const lastMatch = matches.reduce((latest, m) => {
    if (m.status === 'COMPLETED' && (!latest || m.round > latest.round)) {
      return m;
    }
    return latest;
  }, null as Match | null);

  if (lastMatch) {
    const winnerId =
      (lastMatch.homeScore || 0) > (lastMatch.awayScore || 0)
        ? lastMatch.homeTeamId
        : lastMatch.awayTeamId;

    const winnerTeam = teams.find((t) => t.id === winnerId);
    if (winnerTeam) {
      return {
        teamId: winnerTeam.id,
        teamName: winnerTeam.name,
        members: winnerTeam.members.map((m) => m.user.name),
      };
    }
  }

  return null;
}

async function finalizeTournament(tournamentId: string): Promise<{ championTeamId: string; runnerUpTeamId?: string } | null> {
  const response = await retry(
    () =>
      apiCall<{ championTeamId: string; runnerUpTeamId?: string }>(`/tournaments/${tournamentId}/finalize`, {
        method: 'POST',
      }),
    'finalize tournament'
  );
  return response.data;
}

async function cleanupTournament(tournamentId: string): Promise<void> {
  // Delete tournament (cascade delete will handle related data)
  await retry(
    () =>
      apiCall(`/tournaments/${tournamentId}`, {
        method: 'DELETE',
      }),
    'cleanup tournament'
  ).catch(() => {
    // Ignore cleanup errors
  });
}

// ==============================
// RUN PER MODE
// ==============================

async function runMode(mode: TestMode): Promise<TestResult> {
  const result = createResultTemplate(mode);
  let tournamentId = '';

  try {
    log(`🚀 START ${mode}`);

    // Step 1: Create tournament
    log(`  📝 Creating tournament...`);
    const tournament = await createTournament(mode);
    tournamentId = tournament.id;
    result.tournament = {
      id: tournament.id,
      name: tournament.name,
      division: config.DIVISION,
    };

    // Step 2: Open registration
    log(`  📢 Opening registration...`);
    await updateTournamentStatus(tournamentId, 'REGISTRATION');

    // Step 3: Register players
    log(`  👥 Registering ${config.TOTAL_PLAYERS} players...`);
    await registerPlayers(tournamentId);

    // Step 4: Move to approval phase
    log(`  ✅ Moving to approval phase...`);
    await updateTournamentStatus(tournamentId, 'APPROVAL');

    // Step 5: Approve all registrations
    log(`  ✔️ Approving registrations...`);
    await approveAllRegistrations(tournamentId);

    // Step 6: Generate teams
    log(`  🏆 Generating teams...`);
    const teams = await generateTeams(tournamentId);

    // Step 7: Generate bracket
    log(`  📊 Generating bracket...`);
    await generateBracket(tournamentId);

    // Step 8: Start tournament
    log(`  🎮 Starting tournament...`);
    await updateTournamentStatus(tournamentId, 'IN_PROGRESS');

    // Step 9: Simulate matches
    log(`  ⚔️ Simulating matches...`);
    await simulateTournament(tournamentId, result);

    // Step 10: Finalize tournament and get champion
    log(`  🏁 Finalizing tournament...`);
    const finalizeResult = await finalizeTournament(tournamentId);

    // Step 11: Get champion from finalize result or fallback
    log(`  👑 Determining champion...`);
    if (finalizeResult?.championTeamId) {
      const championTeam = teams.find((t) => t.id === finalizeResult.championTeamId);
      if (championTeam) {
        result.champion = {
          teamId: championTeam.id,
          teamName: championTeam.name,
          members: championTeam.members.map((m) => m.user.name),
        };
      }
    } else {
      // Fallback to getting champion from tournament
      result.champion = await getTournamentChampion(tournamentId, teams);
    }

    result.status = 'SUCCESS';
    log(`✅ ${mode} DONE`);
  } catch (err) {
    result.status = 'FAILED';
    result.error = err instanceof Error ? err.message : String(err);
    log(`❌ ${mode} FAILED: ${result.error}`);
  } finally {
    result.finishedAt = new Date();
    result.duration =
      result.finishedAt.getTime() - result.startedAt.getTime();

    // Cleanup
    if (tournamentId) {
      await cleanupTournament(tournamentId);
    }
  }

  return result;
}

// ==============================
// PARALLEL RUN
// ==============================

async function runAll() {
  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  log('🔥 RUNNING PARALLEL TEST...');
  log(`📍 API URL: ${config.BASE_URL}`);
  log(`🎯 Modes: ${config.MODES.join(', ')}`);
  log(`👥 Players: ${config.TOTAL_PLAYERS}`);
  log('');

  const startTime = Date.now();

  // Run all modes in parallel
  const results = await Promise.all(config.MODES.map((mode) => runMode(mode)));

  const totalDuration = Date.now() - startTime;

  // Save results to JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RESULTS_DIR, `result-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

  log(`\n💾 Results saved: ${filePath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  results.forEach((r) => {
    const duration = r.duration ? `${(r.duration / 1000).toFixed(2)}s` : 'N/A';
    const champion = r.champion ? `🏆 ${r.champion.teamName}` : 'No champion';
    console.log(
      `\n${r.mode.padEnd(15)} | ${r.status === 'SUCCESS' ? '✅' : '❌'} ${r.status}` +
        ` | ⏱️ ${duration}` +
        `\n${' '.repeat(15)} | ${champion}` +
        `\n${' '.repeat(15)} | 🎮 ${r.matches.length} matches`
    );

    if (r.error) {
      console.log(`${' '.repeat(15)} | ❗ ${r.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(
    `📈 Success Rate: ${results.filter((r) => r.status === 'SUCCESS').length}/${results.length}`
  );
  console.log('='.repeat(60));

  // Exit with error code if any test failed
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run tests
runAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
