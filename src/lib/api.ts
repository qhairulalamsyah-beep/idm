// API utility functions for fetching data

export interface Tournament {
  id: string;
  name: string;
  division: 'MALE' | 'FEMALE' | 'LIGA';
  mode: string;
  bpm: string;
  bracketType: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  location?: string;
  bannerImage?: string;
  rules?: string;
  prizePool?: PrizePool;
  registrations?: Registration[];
  teams?: Team[];
}

export interface PrizePool {
  id: string;
  tournamentId: string;
  championAmount: number;
  runnerUpAmount: number;
  thirdPlaceAmount: number;
  mvpAmount: number;
  totalAmount: number;
  currency: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  division: string;
  status: string;
  tier: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
    avatar?: string;
  };
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  seed?: number;
  color?: string;
  logo?: string;
  members: {
    id: string;
    userId: string;
    isCaptain: boolean;
    user: {
      id: string;
      name: string | null;
    };
  }[];
}

export interface Match {
  id: string;
  bracketId?: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  bracketSide?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  scheduledAt?: string;
  winnerId?: string;
  homeTeam?: Team;
  awayTeam?: Team;
}

// Fetch tournaments by division
export async function fetchTournaments(division?: 'MALE' | 'FEMALE' | 'LIGA') {
  const url = division ? `/api/tournaments?division=${division}` : '/api/tournaments';
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data as Tournament[];
}

// Fetch single tournament
export async function fetchTournament(id: string) {
  const response = await fetch(`/api/tournaments/${id}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data as Tournament;
}

// Create tournament
export async function createTournament(data: Partial<Tournament>) {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data as Tournament;
}

// Register participant
export async function registerParticipant(data: {
  tournamentId: string;
  name: string;
  phone: string;
  division: string;
  tier?: string;
}) {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Generate teams
export async function generateTeams(tournamentId: string) {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId, generate: true }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Generate bracket
export async function generateBracket(tournamentId: string) {
  const response = await fetch('/api/brackets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Update match score
export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ homeScore, awayScore }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Send OTP
export async function sendOTP(phone: string) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result;
}

// Verify OTP
export async function verifyOTP(phone: string, otp: string) {
  const response = await fetch('/api/auth', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Admin login
export async function adminLogin(phone: string, password: string) {
  const response = await fetch('/api/auth', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}
