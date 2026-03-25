// WhatsApp Bot Service for Idol Meta Tournament
// Full-featured bot with notifications, commands, and image generation

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

// Railway provides PORT environment variable
const PORT = parseInt(process.env.PORT || '3004');
// API Base URL - should be set to your Vercel deployment URL
const API_BASE = process.env.API_BASE || 'http://localhost:81';
// Web URL - for linking in bot responses
const WEB_URL = process.env.WEB_URL || 'https://idolmeta.vercel.app';

// Bot configuration
const BOT_PREFIX = 'p'; // Prefix for commands (e.g., "p jadwal")
const GROUP_ID = process.env.WHATSAPP_GROUP_ID || '120363@g.us'; // Default group ID

// Storage
const pendingRegistrations = new Map<string, {
  phone: string;
  name: string;
  division: string;
  step: string;
  tier?: string;
  tournamentId?: string;
  teamMembers?: string[];
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
}>();

const otpStore = new Map<string, { code: string; expires: number; userId?: string }>();
const userSessions = new Map<string, { userId: string; name: string; role: string; phone: string; expires: number }>();
const notificationSubscriptions = new Map<string, { phone: string; events: string[] }>();
const groupSettings = new Map<string, { tournamentId: string; division: string }>();

interface BotResponse {
  message: string;
  image?: { url: string; caption: string };
  buttons?: { id: string; text: string }[];
}

// ========================================
// API HELPER
// ========================================

async function apiCall(endpoint: string, method: string = 'GET', body?: unknown) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[API] Non-JSON response:', contentType);
      return { success: false, error: 'Non-JSON response', data: null };
    }
    
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    // Log error but don't throw - return gracefully
    console.error('[API] Error:', (error as Error).message);
    return { success: false, error: 'API connection failed', data: null };
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function parseCommand(message: string): { command: string; args: string[] } {
  const parts = message.trim().split(/\s+/);
  const first = parts[0]?.toLowerCase() || '';
  
  // Check if it starts with prefix 'p'
  if (first === 'p' && parts.length > 1) {
    return { command: parts[1]?.toLowerCase() || '', args: parts.slice(2) };
  }
  
  // Check if it's "p something" combined
  if (first.startsWith('p') && first.length > 1) {
    return { command: first.substring(1), args: parts.slice(1) };
  }
  
  // Regular command without prefix
  return { command: first.replace(/[.!]/g, ''), args: parts.slice(1) };
}

function getDivisionEmoji(division: string): string {
  switch (division?.toUpperCase()) {
    case 'MALE': return '♂️';
    case 'FEMALE': return '♀️';
    case 'LIGA': return '👑';
    default: return '🎮';
  }
}

function getTierEmoji(tier: string): string {
  switch (tier?.toUpperCase()) {
    case 'S': return '⭐';
    case 'A': return '🔸';
    case 'B': return '🔹';
    default: return '⚪';
  }
}

// ========================================
// COMMAND HANDLERS
// ========================================

async function handleJadwal(): Promise<BotResponse> {
  const result = await apiCall('/api/tournaments?status=IN_PROGRESS,BRACKET_GENERATION');
  const tournaments = result.success ? result.data?.data || [] : [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get matches for today
  const matchesResult = await apiCall('/api/brackets');
  const allMatches = matchesResult.success ? matchesResult.data?.data?.flatMap((b: any) => b.matches || []) || [] : [];
  
  const todayMatches = allMatches.filter((m: any) => {
    if (!m.scheduledAt) return false;
    const matchDate = new Date(m.scheduledAt);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate.getTime() === today.getTime();
  });

  if (tournaments.length === 0 && todayMatches.length === 0) {
    return {
      message: `📅 *JADWAL HARI INI*\n\nTidak ada pertandingan terjadwal hari ini.\n\nCek jadwal lengkap di aplikasi web.`,
    };
  }

  let message = `📅 *JADWAL PERTANDINGAN HARI INI*\n`;
  message += `_${formatDate(new Date())}_\n\n`;

  if (todayMatches.length > 0) {
    message += `🏓 *Match Hari Ini:*\n`;
    todayMatches.slice(0, 10).forEach((m: any, i: number) => {
      const time = m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBD';
      message += `${i + 1}. [${time}] ${m.homeTeam?.name || 'TBD'} vs ${m.awayTeam?.name || 'TBD'}\n`;
    });
    message += '\n';
  }

  if (tournaments.length > 0) {
    message += `🏆 *Turnamen Aktif:*\n`;
    tournaments.forEach((t: any) => {
      message += `${getDivisionEmoji(t.division)} ${t.name}\n`;
      message += `   📅 ${formatDate(t.startDate)}\n`;
      message += `   📍 ${t.location || 'Online'}\n`;
      message += `   👥 ${t.currentParticipants}/${t.maxParticipants} peserta\n\n`;
    });
  }

  message += `\n🔗 Pantau live di aplikasi web!`;

  return { message };
}

async function handleTopGlobal(): Promise<BotResponse> {
  const result = await apiCall('/api/rankings?type=players&limit=15');
  const rankings = result.success ? result.data?.data || result.data?.players || [] : [];
  
  if (rankings.length === 0) {
    return {
      message: `🏆 *GLOBAL LEADERBOARD*\n\nData ranking belum tersedia.\n\nMain turnamen untuk mengumpulkan poin!`,
    };
  }

  let message = `🏆 *GLOBAL LEADERBOARD*\n\n`;
  
  // Top 3 with special formatting
  const top3 = rankings.slice(0, 3);
  if (top3.length > 0) {
    message += `🥇 *#${1}* ${top3[0]?.name || 'Unknown'} - ${top3[0]?.points || 0} pts\n`;
    if (top3[1]) message += `🥈 *#${2}* ${top3[1].name} - ${top3[1].points} pts\n`;
    if (top3[2]) message += `🥉 *#${3}* ${top3[2].name} - ${top3[2].points} pts\n`;
    message += `\n`;
  }

  // Rest of rankings
  if (rankings.length > 3) {
    message += `_*Top 4-10*_\n`;
    rankings.slice(3, 10).forEach((r: any, i: number) => {
      message += `${i + 4}. ${r.name} - ${r.points} pts\n`;
    });
  }

  message += `\n📊 Total: ${rankings.length} pemain\n`;
  message += `\n💡 Main dan menangkan turnamen untuk naik ranking!`;

  return { message };
}

async function handleBracket(division?: string): Promise<BotResponse> {
  const div = division?.toUpperCase() || 'MALE';
  
  // Get active tournament
  const result = await apiCall(`/api/tournaments?division=${div}&status=IN_PROGRESS,BRACKET_GENERATION`);
  const tournaments = result.success ? result.data?.data || [] : [];
  
  if (tournaments.length === 0) {
    return {
      message: `📊 *BRACKET STATUS*\n\nTidak ada turnamen aktif untuk divisi ${getDivisionEmoji(div)} ${div}.\n\nCek divisi lain: p bracket male/female/liga`,
    };
  }

  const tournament = tournaments[0];
  const bracketResult = await apiCall(`/api/brackets?tournamentId=${tournament.id}`);
  const bracket = bracketResult.success ? bracketResult.data?.data?.[0] : null;

  if (!bracket) {
    return {
      message: `📊 *BRACKET STATUS*\n\n🏆 ${tournament.name}\n\nBracket belum digenerate.\n\nStatus: ${tournament.status}`,
    };
  }

  const matches = bracket.matches || [];
  const completedMatches = matches.filter((m: any) => m.status === 'COMPLETED').length;
  const totalMatches = matches.length;

  let message = `📊 *BRACKET STATUS*\n\n`;
  message += `🏆 ${tournament.name}\n`;
  message += `${getDivisionEmoji(tournament.division)} ${tournament.division}\n\n`;
  message += `📋 *Info Bracket:*\n`;
  message += `• Tipe: ${tournament.bracketType?.replace(/_/g, ' ') || 'Single Elimination'}\n`;
  message += `• Total Match: ${totalMatches}\n`;
  message += `• Selesai: ${completedMatches}/${totalMatches}\n`;
  message += `• Progress: ${totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%\n\n`;

  // Show current round matches
  const currentMatches = matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS').slice(0, 5);
  if (currentMatches.length > 0) {
    message += `🏓 *Match Selanjutnya:*\n`;
    currentMatches.forEach((m: any) => {
      const home = m.homeTeam?.name || 'TBD';
      const away = m.awayTeam?.name || 'TBD';
      const status = m.status === 'IN_PROGRESS' ? '🔴 LIVE' : '⏳';
      message += `${status} ${home} vs ${away}\n`;
    });
  }

  message += `\n🔗 Lihat bracket interaktif di aplikasi web!`;

  return { message };
}

async function handleInfo(): Promise<BotResponse> {
  // Get active tournament for each division
  const [maleResult, femaleResult, ligaResult] = await Promise.all([
    apiCall('/api/tournaments?division=MALE&status=REGISTRATION,IN_PROGRESS'),
    apiCall('/api/tournaments?division=FEMALE&status=REGISTRATION,IN_PROGRESS'),
    apiCall('/api/tournaments?division=LIGA&status=REGISTRATION,IN_PROGRESS'),
  ]);

  const maleT = maleResult.success ? maleResult.data?.data?.[0] : null;
  const femaleT = femaleResult.success ? femaleResult.data?.data?.[0] : null;
  const ligaT = ligaResult.success ? ligaResult.data?.data?.[0] : null;

  let message = `🎮 *IDOL META TOURNAMENT*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (maleT) {
    message += `${getDivisionEmoji('MALE')} *MALE DIVISION*\n`;
    message += `📍 ${maleT.name}\n`;
    message += `📅 ${formatDate(maleT.startDate)}\n`;
    message += `📍 ${maleT.location || 'Online'}\n`;
    message += `🎵 BPM: ${maleT.bpm || 'Random 120-140'}\n`;
    message += `👥 ${maleT.currentParticipants}/${maleT.maxParticipants} peserta\n`;
    message += `📊 Mode: ${maleT.mode || 'GR Arena 3vs3'}\n\n`;
  }

  if (femaleT) {
    message += `${getDivisionEmoji('FEMALE')} *FEMALE DIVISION*\n`;
    message += `📍 ${femaleT.name}\n`;
    message += `📅 ${formatDate(femaleT.startDate)}\n`;
    message += `📍 ${femaleT.location || 'Online'}\n`;
    message += `🎵 BPM: ${femaleT.bpm || 'Random 120-140'}\n`;
    message += `👥 ${femaleT.currentParticipants}/${femaleT.maxParticipants} peserta\n`;
    message += `📊 Mode: ${femaleT.mode || 'GR Arena 3vs3'}\n\n`;
  }

  if (ligaT) {
    message += `${getDivisionEmoji('LIGA')} *LIGA IDM*\n`;
    message += `📍 ${ligaT.name}\n`;
    message += `📅 ${formatDate(ligaT.startDate)}\n`;
    message += `📍 ${ligaT.location || 'Online'}\n`;
    message += `🎵 BPM: ${ligaT.bpm || 'Random 120-140'}\n`;
    message += `👥 ${ligaT.currentParticipants}/${ligaT.maxParticipants} peserta\n`;
    message += `📊 Mode: ${ligaT.mode || 'GR Arena 5vs5'}\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📞 Contact: +6281349924210\n`;
  message += `🌐 Web: idolmeta.id\n\n`;
  message += `💡 Ketik *p help* untuk bantuan`;

  return { message };
}

async function handleTim(playerName?: string): Promise<BotResponse> {
  if (!playerName) {
    // Show list of teams
    const result = await apiCall('/api/teams');
    const teams = result.success ? result.data?.data || [] : [];
    
    if (teams.length === 0) {
      return { message: `👥 Belum ada tim terdaftar.` };
    }

    let message = `👥 *DAFTAR TIM*\n\n`;
    teams.slice(0, 15).forEach((t: any, i: number) => {
      const div = getDivisionEmoji(t.tournament?.division);
      message += `${i + 1}. ${div} ${t.name} (${t.members?.length || 0} pemain)\n`;
    });

    message += `\n_total ${teams.length} tim_\n\n`;
    message += `💡 Detail tim: *p tim [nama_tim]*\n`;
    message += `Contoh: p tim Alpha Squad`;

    return { message };
  }

  // Search for player's team
  const searchName = playerName.toLowerCase();
  const result = await apiCall('/api/teams');
  const teams = result.success ? result.data?.data || [] : [];

  // Find team containing this player
  const playerTeam = teams.find((t: any) => 
    t.members?.some((m: any) => m.user?.name?.toLowerCase().includes(searchName))
  );

  if (!playerTeam) {
    return {
      message: `🔍 Pemain "${playerName}" tidak ditemukan.\n\nCek daftar tim: *p tim*`,
    };
  }

  const member = playerTeam.members?.find((m: any) => 
    m.user?.name?.toLowerCase().includes(searchName)
  );

  let message = `👥 *INFO TIM & PEMAIN*\n\n`;
  message += `🎮 *Pemain:* ${member?.user?.name || playerName}\n`;
  message += `${getTierEmoji(member?.user?.tier)} Tier: ${member?.user?.tier || 'B'}\n`;
  message += `👑 Captain: ${member?.isCaptain ? '✅ Ya' : '❌ Tidak'}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🏷️ *Tim:* ${playerTeam.name}\n`;
  message += `${getDivisionEmoji(playerTeam.tournament?.division)} Divisi: ${playerTeam.tournament?.division || '-'}\n`;
  message += `🏆 Turnamen: ${playerTeam.tournament?.name || '-'}\n\n`;
  
  message += `👤 *Anggota Tim:*\n`;
  playerTeam.members?.forEach((m: any, i: number) => {
    const captain = m.isCaptain ? ' 👑' : '';
    const tier = getTierEmoji(m.user?.tier);
    message += `${i + 1}. ${tier} ${m.user?.name || 'Unknown'}${captain}\n`;
  });

  return { message };
}

async function handleDaftar(from: string, args: string[], senderName?: string): Promise<BotResponse> {
  if (args.length < 2) {
    const tournaments = await apiCall('/api/tournaments?status=REGISTRATION');
    const active = tournaments.success ? tournaments.data?.data || [] : [];

    return {
      message: `📝 *FORMAT PENDAFTARAN*\n\nKetik: p daftar [nama] [divisi]\n\nContoh:\n• p daftar Tazos male\n• p daftar Luna female\n• p daftar Alpha liga\n\nDivisi tersedia:\n• male - Male Division (3vs3)\n• female - Female Division (3vs3)\n• liga - Liga IDM (5vs5)\n\n🏆 *Turnamen Buka Pendaftaran:*\n${active.length > 0 ? active.map((t: any) => `${getDivisionEmoji(t.division)} ${t.name}`).join('\n') : 'Tidak ada turnamen buka pendaftaran'}`,
    };
  }

  const name = args[0];
  const division = args[1].toUpperCase();

  if (!['MALE', 'FEMALE', 'LIGA'].includes(division)) {
    return {
      message: `❌ Divisi tidak valid!\n\nPilih: male, female, atau liga`,
    };
  }

  // Get active tournament for this division
  const tournamentResult = await apiCall(`/api/tournaments?division=${division}&status=REGISTRATION`);
  const tournament = tournamentResult.success ? tournamentResult.data?.data?.[0] : null;

  if (!tournament) {
    return {
      message: `❌ Tidak ada turnamen ${getDivisionEmoji(division)} ${division} yang buka pendaftaran.`,
    };
  }

  // Store pending registration
  pendingRegistrations.set(from, {
    phone: from,
    name,
    division,
    tournamentId: tournament.id,
    step: division === 'LIGA' ? 'team_members' : 'tier',
  });

  if (division === 'LIGA') {
    return {
      message: `👑 *PENDAFTARAN LIGA IDM*\n\nTurnamen: ${tournament.name}\nNama Tim: ${name}\n\nMasukkan nama 5 pemain (pisahkan dengan koma):\n\nContoh: Tazos, Shadow, Phoenix, Blaze, Storm`,
    };
  }

  return {
    message: `📝 *KONFIRMASI PENDAFTARAN*\n\nTurnamen: ${tournament.name}\nNama: ${name}\nDivisi: ${getDivisionEmoji(division)} ${division}\n\nPilih tier Anda:\n• S - Pro Player (pengalaman kompetitif)\n• A - Experienced (rutin bermain)\n• B - Beginner (pemula)\n\nKetik tier (S/A/B):`,
  };
}

async function handleScore(from: string, args: string[]): Promise<BotResponse> {
  const pending = pendingRegistrations.get(from);
  
  // Check if confirming a score update
  if (pending?.step === 'confirm_score') {
    const response = args[0]?.toLowerCase();
    
    if (response === 'ya' || response === 'y' || response === 'yes') {
      // Update the match score via API
      const result = await apiCall(`/api/matches/${pending.matchId}`, 'PATCH', {
        homeScore: pending.homeScore,
        awayScore: pending.awayScore,
      });

      pendingRegistrations.delete(from);

      if (result.success) {
        return {
          message: `✅ *SKOR BERHASIL DIUPDATE!*\n\nMatch ID: ${pending.matchId}\nSkor: ${pending.homeScore} - ${pending.awayScore}\n\n🏆 Skor akan otomatis terupdate di website.`,
        };
      } else {
        return {
          message: `❌ Gagal update skor: ${result.data?.error || 'Terjadi kesalahan'}`,
        };
      }
    }

    if (response === 'batal' || response === 'no' || response === 'n') {
      pendingRegistrations.delete(from);
      return { message: `❌ Update skor dibatalkan.` };
    }
  }

  // Start score update flow
  if (args.length < 3) {
    return {
      message: `📊 *INPUT SKOR PERTANDINGAN*\n\nFormat: p skor [match_id] [skor_home] [skor_away]\n\nContoh: p skor cm123abc 2 1\n\nHubungi admin untuk mendapatkan Match ID.`,
    };
  }

  const [matchId, homeStr, awayStr] = args;
  const homeScore = parseInt(homeStr);
  const awayScore = parseInt(awayStr);

  if (isNaN(homeScore) || isNaN(awayScore)) {
    return { message: `❌ Skor harus berupa angka!` };
  }

  // Get match details
  const matchResult = await apiCall(`/api/matches/${matchId}`);
  if (!matchResult.success) {
    return { message: `❌ Match tidak ditemukan!` };
  }

  const match = matchResult.data;
  
  // Store pending score update
  pendingRegistrations.set(from, {
    phone: from,
    name: '',
    division: '',
    matchId,
    homeScore,
    awayScore,
    step: 'confirm_score',
  });

  return {
    message: `📊 *KONFIRMASI UPDATE SKOR*\n\nMatch: ${match.homeTeam?.name || 'TBD'} vs ${match.awayTeam?.name || 'TBD'}\nSkor Baru: ${homeScore} - ${awayScore}\n\nBalas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`,
  };
}

async function handleHasil(division?: string): Promise<BotResponse> {
  const div = division?.toUpperCase() || null;
  
  // Get completed tournaments
  const endpoint = div 
    ? `/api/tournaments?division=${div}&status=COMPLETED`
    : '/api/tournaments?status=COMPLETED';
  
  const result = await apiCall(endpoint);
  const tournaments = result.success ? result.data?.data || [] : [];

  if (tournaments.length === 0) {
    return {
      message: `🏆 *HASIL TURNAMEN*\n\nBelum ada turnamen yang selesai.\n\nCek hasil per divisi:\n• p hasil male\n• p hasil female\n• p hasil liga`,
    };
  }

  let message = `🏆 *HASIL TURNAMEN*\n\n`;

  for (const t of tournaments.slice(0, 3)) {
    message += `${getDivisionEmoji(t.division)} *${t.name}*\n`;
    
    if (t.champion) {
      // Get champion team members
      const championTeamId = t.champion.championTeamId;
      const teamResult = await apiCall(`/api/teams`);
      const allTeams = teamResult.success ? teamResult.data?.data || [] : [];
      const championTeam = allTeams.find((team: any) => team.id === championTeamId);
      
      // Format team members
      let membersStr = '';
      if (championTeam?.members && championTeam.members.length > 0) {
        const memberNames = championTeam.members.map((m: any) => m.user?.name || 'Unknown');
        membersStr = ` (${memberNames.join(', ')})`;
      }
      
      message += `🥇 Champion: ${t.champion.championTeam?.name || 'TBD'}${membersStr}\n`;
      
      // Get runner-up team members
      const runnerUpTeamId = t.champion.runnerUpTeamId;
      const runnerUpTeam = allTeams.find((team: any) => team.id === runnerUpTeamId);
      
      let runnerUpMembersStr = '';
      if (runnerUpTeam?.members && runnerUpTeam.members.length > 0) {
        const memberNames = runnerUpTeam.members.map((m: any) => m.user?.name || 'Unknown');
        runnerUpMembersStr = ` (${memberNames.join(', ')})`;
      }
      
      message += `🥈 Runner-up: ${t.champion.runnerUpTeam?.name || 'TBD'}${runnerUpMembersStr}\n`;
      
      // Third place
      if (t.champion.thirdPlaceTeamId) {
        const thirdPlaceTeam = allTeams.find((team: any) => team.id === t.champion.thirdPlaceTeamId);
        let thirdMembersStr = '';
        if (thirdPlaceTeam?.members && thirdPlaceTeam.members.length > 0) {
          const memberNames = thirdPlaceTeam.members.map((m: any) => m.user?.name || 'Unknown');
          thirdMembersStr = ` (${memberNames.join(', ')})`;
        }
        message += `🥉 Third: ${t.champion.thirdPlaceTeam?.name || 'TBD'}${thirdMembersStr}\n`;
      }
      
      if (t.champion.mvp) {
        message += `⭐ MVP: ${t.champion.mvp.name || 'TBD'}\n`;
      }
    }
    
    if (t.prizePool) {
      message += `💰 Prize: ${formatRupiah(t.prizePool.totalAmount)}\n`;
    }
    message += `\n`;
  }

  message += `🔗 Detail lengkap di aplikasi web!`;

  return { message };
}

async function handleHelp(): Promise<BotResponse> {
  return {
    message: `📚 *PANDUAN BOT IDM TOURNAMENT*\n
━━━━━━━━━━━━━━━━━━━━

📝 *PENDAFTARAN*
• p daftar [nama] [divisi]
• p peserta - Daftar peserta

📅 *INFORMASI*
• p jadwal - Jadwal hari ini
• p info - Info turnamen
• p bracket [divisi] - Status bracket
• p hasil [divisi] - Hasil turnamen

🏆 *RANKING*
• p top global - Leaderboard
• p tim [nama] - Info tim/pemain

📊 *ADMIN/SKOR*
• p skor [id] [home] [away]

💰 *LAINNYA*
• p donasi [jumlah] [pesan]
• p notif on/off

━━━━━━━━━━━━━━━━━━━━
🎮 *IDOL META TOURNAMENT*
📞 +6281349924210`,
  };
}

// ========================================
// MAIN MESSAGE HANDLER
// ========================================

async function handleMessage(
  from: string,
  message: string,
  senderName?: string,
  isGroup: boolean = false
): Promise<BotResponse> {
  const { command, args } = parseCommand(message);

  // Handle multi-step flows
  const pending = pendingRegistrations.get(from);
  if (pending && !['batal', 'cancel'].includes(command)) {
    return handleRegistrationStep(from, message, pending);
  }

  // Handle commands
  switch (command) {
    case 'jadwal':
      return handleJadwal();

    case 'top':
    case 'ranking':
    case 'leaderboard':
      return handleTopGlobal();

    case 'bracket':
      return handleBracket(args[0]);

    case 'info':
      return handleInfo();

    case 'tim':
    case 'team':
      return handleTim(args.join(' '));

    case 'daftar':
    case 'register':
      return handleDaftar(from, args, senderName);

    case 'skor':
    case 'score':
      return handleScore(from, args);

    case 'hasil':
    case 'result':
      return handleHasil(args[0]);

    case 'peserta':
    case 'participants':
      return handlePeserta();

    case 'donasi':
    case 'donate':
      return handleDonasi(from, args);

    case 'notif':
    case 'notification':
      return handleNotification(from, args);

    case 'help':
    case 'bantuan':
    case 'menu':
      return handleHelp();

    case 'status':
      return handleStatus(from);

    default:
      if (isGroup) {
        // In group, only respond to prefixed commands
        return { message: '' }; // Silent ignore
      }
      return {
        message: `👋 Hai! Saya bot *Idol Meta Tournament*.\n\nKetik *p help* untuk melihat daftar perintah.\n\n🎮 Daftar sekarang: p daftar [nama] [divisi]`,
      };
  }
}

// ========================================
// HELPER HANDLERS
// ========================================

async function handleRegistrationStep(
  from: string,
  message: string,
  pending: any
): Promise<BotResponse> {
  const response = message.toLowerCase().trim();

  // Handle confirm score
  if (pending.step === 'confirm_score') {
    return handleScore(from, [response]);
  }

  // Handle Liga team members
  if (pending.step === 'team_members' && pending.division === 'LIGA') {
    const members = message.split(',').map((m: string) => m.trim()).filter((m: string) => m);
    if (members.length < 5) {
      return {
        message: `❌ Minimal 5 pemain untuk Liga IDM.\n\nAnda memasukkan ${members.length} pemain.\n\nCoba lagi:`,
      };
    }
    pending.teamMembers = members;
    pending.step = 'confirm';
    
    return {
      message: `👑 *KONFIRMASI TIM LIGA*\n\nTurnamen: ${pending.tournamentId}\nNama Tim: ${pending.name}\n\nPemain:\n${members.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}\n\nBalas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`,
    };
  }

  // Handle tier selection
  if (pending.step === 'tier') {
    if (['s', 'a', 'b'].includes(response)) {
      pending.tier = response.toUpperCase();
    }
    pending.step = 'confirm';
    
    return {
      message: `📝 *KONFIRMASI PENDAFTARAN*\n\nNama: ${pending.name}\nDivisi: ${getDivisionEmoji(pending.division)} ${pending.division}\nTier: ${getTierEmoji(pending.tier)} ${pending.tier || 'Akan ditentukan admin'}\n\nBalas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`,
    };
  }

  // Handle confirmation
  if (pending.step === 'confirm') {
    if (response === 'ya' || response === 'yes' || response === 'y') {
      const result = await apiCall('/api/registrations', 'POST', {
        tournamentId: pending.tournamentId,
        name: pending.name,
        phone: from,
        division: pending.division,
        tier: pending.tier,
      });
      
      pendingRegistrations.delete(from);
      
      if (result.success) {
        return {
          message: `🎉 *PENDAFTARAN BERHASIL!*\n\nNama: ${pending.name}\nDivisi: ${getDivisionEmoji(pending.division)} ${pending.division}\n\n✅ Anda akan menerima notifikasi saat pendaftaran disetujui.\n\n💡 Ketik *p notif on* untuk mengaktifkan notifikasi.`,
        };
      } else {
        return {
          message: `❌ Pendaftaran gagal: ${result.data?.error || 'Terjadi kesalahan'}\n\nCoba lagi atau hubungi admin.`,
        };
      }
    }

    if (response === 'batal' || response === 'no' || response === 'n') {
      pendingRegistrations.delete(from);
      return { message: `❌ Pendaftaran dibatalkan.` };
    }
  }

  return {
    message: `Balas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`,
  };
}

async function handlePeserta(): Promise<BotResponse> {
  const result = await apiCall('/api/registrations?status=APPROVED');
  const registrations = result.success ? result.data?.data || [] : [];

  if (registrations.length === 0) {
    return { message: `📝 Belum ada peserta terdaftar.` };
  }

  // Group by division
  const grouped: Record<string, any[]> = {};
  registrations.forEach((r: any) => {
    const div = r.division || r.tournament?.division || 'OTHER';
    if (!grouped[div]) grouped[div] = [];
    grouped[div].push(r);
  });

  let message = `📝 *PESERTA TERDAFTAR*\n\n`;

  Object.entries(grouped).forEach(([div, regs]) => {
    message += `${getDivisionEmoji(div)} *${div}*\n`;
    regs.slice(0, 8).forEach((r: any) => {
      const tier = getTierEmoji(r.tier);
      message += `${tier} ${r.user?.name || r.name}\n`;
    });
    if (regs.length > 8) message += `...dan ${regs.length - 8} lainnya\n`;
    message += `\n`;
  });

  message += `Total: ${registrations.length} peserta`;

  return { message };
}

async function handleDonasi(from: string, args: string[]): Promise<BotResponse> {
  if (args.length < 2) {
    return {
      message: `💝 *DONASI & SAWERAN*\n\nFormat: p donasi [jumlah] [pesan]\n\nContoh: p donasi 50000 semangat peserta!\n\n💰 Donasi akan ditambahkan ke prize pool turnamen.`,
    };
  }

  const amount = parseInt(args[0]);
  const msg = args.slice(1).join(' ');

  if (isNaN(amount) || amount < 10000) {
    return { message: `❌ Minimal donasi Rp 10.000` };
  }

  // Create donation record
  const result = await apiCall('/api/donations', 'POST', {
    name: from,
    amount,
    message: msg,
    paymentMethod: 'WA',
  });

  return {
    message: `💝 *TERIMA KASIH!*\n\nDonasi Anda: ${formatRupiah(amount)}\nPesan: ${msg || '-'}\n\n✅ Silakan transfer ke:\nBank: BCA\nRekening: 1234567890\nNama: Idol Meta\n\nKonfirmasi setelah transfer dengan mengetik:\np konfirmasi donasi ${amount}`,
  };
}

async function handleNotification(from: string, args: string[]): Promise<BotResponse> {
  const action = args[0]?.toLowerCase();

  if (action === 'on') {
    notificationSubscriptions.set(from, { phone: from, events: ['match', 'tournament', 'donation'] });
    return {
      message: `🔔 *NOTIFIKASI AKTIF*\n\nAnda akan menerima notifikasi untuk:\n• Jadwal pertandingan\n• Update turnamen\n• Donasi & saweran\n\nKetik *p notif off* untuk menonaktifkan.`,
    };
  }

  if (action === 'off') {
    notificationSubscriptions.delete(from);
    return {
      message: `🔕 Notifikasi dinonaktifkan.\n\nKetik *p notif on* untuk mengaktifkan kembali.`,
    };
  }

  const isSubscribed = notificationSubscriptions.has(from);
  return {
    message: `🔔 *PENGATURAN NOTIFIKASI*\n\nStatus: ${isSubscribed ? '✅ Aktif' : '❌ Tidak Aktif'}\n\nKetik:\n• p notif on - Aktifkan\n• p notif off - Nonaktifkan`,
  };
}

async function handleStatus(from: string): Promise<BotResponse> {
  const session = userSessions.get(from);
  const isSubscribed = notificationSubscriptions.has(from);

  // Get user from API
  const result = await apiCall(`/api/admin/users?phone=${from}`);
  const user = result.success ? result.data?.data?.[0] : null;

  if (!user) {
    return {
      message: `📊 *STATUS AKUN*\n\nStatus: Belum terdaftar\nNotifikasi: ${isSubscribed ? 'Aktif' : 'Tidak Aktif'}\n\nKetik *p daftar [nama] [divisi]* untuk mendaftar.`,
    };
  }

  return {
    message: `📊 *STATUS AKUN*\n\nNama: ${user.name}\nPhone: ${user.phone}\nRole: ${user.role}\nTier: ${getTierEmoji(user.tier)} ${user.tier}\nPoints: ${user.points || 0}\nNotifikasi: ${isSubscribed ? '✅ Aktif' : '❌ Tidak Aktif'}`,
  };
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  console.log(`[WA-NOTIF] To: ${phone}`);
  console.log(`[WA-NOTIF] Message: ${message.substring(0, 100)}...`);
  // In production, integrate with WhatsApp Business API
  return true;
}

export async function broadcastToGroup(event: string, data: any): Promise<void> {
  const message = formatEventMessage(event, data);
  console.log(`[WA-BROADCAST] Event: ${event}`);
  console.log(`[WA-BROADCAST] Message: ${message}`);
  
  // Also notify individual subscribers
  for (const [phone] of notificationSubscriptions) {
    await sendWhatsAppNotification(phone, message);
  }
}

function formatEventMessage(event: string, data: any): string {
  switch (event) {
    case 'match-start':
      return `🔥 *MATCH DIMULAI!*

🏓 ${data.homeTeam} vs ${data.awayTeam}
📍 ${data.tournament || 'Turnamen'}

🔗 Detail: ${WEB_URL}`;

    case 'match-end':
      return `🏆 *MATCH SELESAI!*

🏓 ${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}

🎉 Pemenang: *${data.winner}*

🔗 Detail: ${WEB_URL}`;

    case 'tournament-finalize':
      // Format team members if available
      let championMembers = '';
      let runnerUpMembers = '';
      let thirdMembers = '';
      
      if (data.championMembers && data.championMembers.length > 0) {
        championMembers = ` (${data.championMembers.join(', ')})`;
      }
      if (data.runnerUpMembers && data.runnerUpMembers.length > 0) {
        runnerUpMembers = ` (${data.runnerUpMembers.join(', ')})`;
      }
      if (data.thirdPlaceMembers && data.thirdPlaceMembers.length > 0) {
        thirdMembers = ` (${data.thirdPlaceMembers.join(', ')})`;
      }
      
      return `👑 *TURNAMEN SELESAI!*

🏆 *CHAMPION:* ${data.champion}${championMembers}
🥈 *RUNNER-UP:* ${data.runnerUp}${runnerUpMembers}
${data.thirdPlace ? `🥉 *THIRD PLACE:* ${data.thirdPlace}${thirdMembers}\n` : ''}
⭐ *MVP:* ${data.mvp || 'TBD'}

Selamat kepada semua pemenang! 🎉

🔗 Detail lengkap: ${WEB_URL}`;

    case 'tournament-start':
      return `🎮 *TURNAMEN DIMULAI!*

🏆 ${data.tournamentName}
${getDivisionEmoji(data.division)} ${data.division}

Bracket sudah tersedia!

🔗 Detail: ${WEB_URL}`;

    case 'registration-approved':
      return `✅ *PENDAFTARAN DISETUJUI!*

Nama: ${data.name}
Divisi: ${getDivisionEmoji(data.division)} ${data.division}
Tier: ${getTierEmoji(data.tier)} ${data.tier}

Tim akan segera dibentuk!
Tunggu info selanjutnya.

🔗 Detail: ${WEB_URL}`;

    case 'donation':
      return `💝 *DONASI BARU!*

${data.from} memberikan ${formatRupiah(data.amount)}
"${data.message || 'Semangat peserta!'}"

Terima kasih telah mendukung turnamen! 🙏

🔗 Detail: ${WEB_URL}`;

    default:
      return `📢 ${event}\n\n${JSON.stringify(data, null, 2)}\n\n🔗 ${WEB_URL}`;
  }
}

// ========================================
// HTTP SERVER
// ========================================

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = parse(req.url || '', true);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'whatsapp-bot',
      port: PORT,
      subscriptions: notificationSubscriptions.size,
    }));
    return;
  }

  // Webhook endpoint (for receiving messages)
  if (url.pathname === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const response = await handleMessage(
          data.from || '',
          data.message || '',
          data.senderName,
          data.isGroup || false
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, response }));
      } catch (error) {
        console.error('Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // Broadcast endpoint (for admin to send notifications)
  if (url.pathname === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await broadcastToGroup(data.event, data.data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          recipients: notificationSubscriptions.size,
          message: 'Broadcast sent'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // Send to specific phone
  if (url.pathname === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const success = await sendWhatsAppNotification(data.phone, data.message);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // Test endpoint
  if (url.pathname === '/test') {
    try {
      const message = url.query.message as string || 'p help';
      const from = (url.query.from as string) || 'test';
      const response = await handleMessage(from, message, 'Test User', false);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, response }));
    } catch (error) {
      console.error('[TEST] Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal error' }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log(`[WA-BOT] WhatsApp Bot Service running on port ${PORT}`);
  console.log(`[WA-BOT] Webhook: http://localhost:${PORT}/webhook`);
  console.log(`[WA-BOT] Broadcast: http://localhost:${PORT}/broadcast`);
  console.log(`[WA-BOT] Send: http://localhost:${PORT}/send`);
  console.log(`[WA-BOT] Test: http://localhost:${PORT}/test?message=p%20help`);
});
