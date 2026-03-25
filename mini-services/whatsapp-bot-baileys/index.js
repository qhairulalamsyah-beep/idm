/**
 * IDM WhatsApp Bot - Baileys Version
 * Untuk menjalankan di Termux (Android) atau VPS
 * 
 * Cara Install:
 * 1. Install Termux dari F-Droid
 * 2. pkg install nodejs git
 * 3. git clone <repo>
 * 4. cd whatsapp-bot-baileys
 * 5. npm install
 * 6. npm start
 * 7. Scan QR Code dengan WhatsApp
 */

import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'

// ========================================
// KONFIGURASI
// ========================================

// Ganti dengan URL Vercel Anda
const API_BASE = process.env.API_BASE || 'https://idm.vercel.app'
const WEB_URL = process.env.WEB_URL || 'https://idolmeta.vercel.app'

// Grup WhatsApp untuk notifikasi (opsional)
const GROUP_ID = process.env.GROUP_ID || null

// Prefix command
const PREFIX = 'p'

// ========================================
// STORAGE
// ========================================

const pendingRegistrations = new Map()
const notificationSubscriptions = new Map()

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDivisionEmoji(division) {
  switch (division?.toUpperCase()) {
    case 'MALE': return '♂️'
    case 'FEMALE': return '♀️'
    case 'LIGA': return '👑'
    default: return '🎮'
  }
}

function getTierEmoji(tier) {
  switch (tier?.toUpperCase()) {
    case 'S': return '⭐'
    case 'A': return '🔸'
    case 'B': return '🔹'
    default: return '⚪'
  }
}

function parseCommand(message) {
  const parts = message.trim().split(/\s+/)
  const first = parts[0]?.toLowerCase() || ''
  
  // Check if it starts with prefix 'p'
  if (first === PREFIX && parts.length > 1) {
    return { command: parts[1]?.toLowerCase() || '', args: parts.slice(2) }
  }
  
  // Check if it's "p something" combined
  if (first.startsWith(PREFIX) && first.length > 1) {
    return { command: first.substring(1), args: parts.slice(1) }
  }
  
  return { command: first.replace(/[.!]/g, ''), args: parts.slice(1) }
}

// ========================================
// API HELPER
// ========================================

async function apiCall(endpoint, method = 'GET', body) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    const data = await res.json()
    return { success: res.ok, data }
  } catch (error) {
    console.error('[API] Error:', error.message)
    return { success: false, error: error.message }
  }
}

// ========================================
// COMMAND HANDLERS
// ========================================

async function handleJadwal() {
  const result = await apiCall('/api/tournaments?status=IN_PROGRESS,BRACKET_GENERATION')
  const tournaments = result.success ? result.data?.data || [] : []
  
  if (tournaments.length === 0) {
    return `📅 *JADWAL HARI INI*\n\nTidak ada pertandingan terjadwal hari ini.\n\n🔗 Detail: ${WEB_URL}`
  }

  let message = `📅 *JADWAL PERTANDINGAN*\n\n`
  
  tournaments.forEach(t => {
    message += `${getDivisionEmoji(t.division)} *${t.name}*\n`
    message += `📅 ${formatDate(t.startDate)}\n`
    message += `📍 ${t.location || 'Online'}\n`
    message += `👥 ${t.currentParticipants}/${t.maxParticipants} peserta\n\n`
  })

  message += `🔗 Detail lengkap: ${WEB_URL}`
  return message
}

async function handleTopGlobal() {
  const result = await apiCall('/api/rankings?type=players&limit=15')
  const rankings = result.success ? result.data?.data || result.data?.players || [] : []
  
  if (rankings.length === 0) {
    return `🏆 *GLOBAL LEADERBOARD*\n\nData ranking belum tersedia.\n\nMain turnamen untuk mengumpulkan poin!\n\n🔗 Detail: ${WEB_URL}`
  }

  let message = `🏆 *GLOBAL LEADERBOARD*\n\n`
  
  const top3 = rankings.slice(0, 3)
  if (top3.length > 0) {
    message += `🥇 *#${1}* ${top3[0]?.name || 'Unknown'} - ${top3[0]?.points || 0} pts\n`
    if (top3[1]) message += `🥈 *#${2}* ${top3[1].name} - ${top3[1].points} pts\n`
    if (top3[2]) message += `🥉 *#${3}* ${top3[2].name} - ${top3[2].points} pts\n`
    message += `\n`
  }

  if (rankings.length > 3) {
    message += `_*Top 4-10*_\n`
    rankings.slice(3, 10).forEach((r, i) => {
      message += `${i + 4}. ${r.name} - ${r.points} pts\n`
    })
  }

  message += `\n📊 Total: ${rankings.length} pemain\n`
  message += `\n🔗 Detail lengkap: ${WEB_URL}`
  return message
}

async function handleBracket(division) {
  const div = division?.toUpperCase() || 'MALE'
  
  const result = await apiCall(`/api/tournaments?division=${div}&status=IN_PROGRESS,BRACKET_GENERATION`)
  const tournaments = result.success ? result.data?.data || [] : []
  
  if (tournaments.length === 0) {
    return `📊 *BRACKET STATUS*\n\nTidak ada turnamen aktif untuk divisi ${getDivisionEmoji(div)} ${div}.`
  }

  const tournament = tournaments[0]
  const bracketResult = await apiCall(`/api/brackets?tournamentId=${tournament.id}`)
  const bracket = bracketResult.success ? bracketResult.data?.data?.[0] : null

  if (!bracket) {
    return `📊 *BRACKET STATUS*\n\n🏆 ${tournament.name}\n\nBracket belum digenerate.`
  }

  const matches = bracket.matches || []
  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length
  const totalMatches = matches.length

  let message = `📊 *BRACKET STATUS*\n\n`
  message += `🏆 ${tournament.name}\n`
  message += `${getDivisionEmoji(tournament.division)} ${tournament.division}\n\n`
  message += `📋 *Info Bracket:*\n`
  message += `• Tipe: ${tournament.bracketType?.replace(/_/g, ' ') || 'Single Elimination'}\n`
  message += `• Total Match: ${totalMatches}\n`
  message += `• Selesai: ${completedMatches}/${totalMatches}\n`
  message += `• Progress: ${totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%\n\n`

  const currentMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS').slice(0, 5)
  if (currentMatches.length > 0) {
    message += `🏓 *Match Selanjutnya:*\n`
    currentMatches.forEach(m => {
      const home = m.homeTeam?.name || 'TBD'
      const away = m.awayTeam?.name || 'TBD'
      const status = m.status === 'IN_PROGRESS' ? '🔴 LIVE' : '⏳'
      message += `${status} ${home} vs ${away}\n`
    })
  }

  message += `\n🔗 Detail lengkap: ${WEB_URL}`
  return message
}

async function handleInfo() {
  const [maleResult, femaleResult, ligaResult] = await Promise.all([
    apiCall('/api/tournaments?division=MALE&status=REGISTRATION,IN_PROGRESS'),
    apiCall('/api/tournaments?division=FEMALE&status=REGISTRATION,IN_PROGRESS'),
    apiCall('/api/tournaments?division=LIGA&status=REGISTRATION,IN_PROGRESS')
  ])

  const maleT = maleResult.success ? maleResult.data?.data?.[0] : null
  const femaleT = femaleResult.success ? femaleResult.data?.data?.[0] : null
  const ligaT = ligaResult.success ? ligaResult.data?.data?.[0] : null

  let message = `🎮 *IDOL META FAN MADE EDITION*\n\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`

  if (maleT) {
    message += `${getDivisionEmoji('MALE')} *MALE DIVISION*\n`
    message += `📍 ${maleT.name}\n`
    message += `📅 ${formatDate(maleT.startDate)}\n`
    message += `📍 ${maleT.location || 'Online'}\n`
    message += `🎵 BPM: ${maleT.bpm || 'Random 120-140'}\n`
    message += `👥 ${maleT.currentParticipants}/${maleT.maxParticipants} peserta\n`
    message += `📊 Mode: ${maleT.mode || 'GR Arena 3vs3'}\n\n`
  }

  if (femaleT) {
    message += `${getDivisionEmoji('FEMALE')} *FEMALE DIVISION*\n`
    message += `📍 ${femaleT.name}\n`
    message += `📅 ${formatDate(femaleT.startDate)}\n`
    message += `📍 ${femaleT.location || 'Online'}\n`
    message += `🎵 BPM: ${femaleT.bpm || 'Random 120-140'}\n`
    message += `👥 ${femaleT.currentParticipants}/${femaleT.maxParticipants} peserta\n`
    message += `📊 Mode: ${femaleT.mode || 'GR Arena 3vs3'}\n\n`
  }

  if (ligaT) {
    message += `${getDivisionEmoji('LIGA')} *LIGA IDM*\n`
    message += `📍 ${ligaT.name}\n`
    message += `📅 ${formatDate(ligaT.startDate)}\n`
    message += `📍 ${ligaT.location || 'Online'}\n`
    message += `🎵 BPM: ${ligaT.bpm || 'Random 120-140'}\n`
    message += `👥 ${ligaT.currentParticipants}/${ligaT.maxParticipants} peserta\n`
    message += `📊 Mode: ${ligaT.mode || 'GR Arena 5vs5'}\n\n`
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`
  message += `📞 Contact: +6281349924210\n`
  message += `🌐 Web: ${WEB_URL}\n\n`
  message += `💡 Ketik *p help* untuk bantuan`

  return message
}

async function handleTim(playerName) {
  if (!playerName) {
    const result = await apiCall('/api/teams')
    const teams = result.success ? result.data?.data || [] : []
    
    if (teams.length === 0) {
      return `👥 Belum ada tim terdaftar.`
    }

    let message = `👥 *DAFTAR TIM*\n\n`
    teams.slice(0, 15).forEach((t, i) => {
      const div = getDivisionEmoji(t.tournament?.division)
      message += `${i + 1}. ${div} ${t.name} (${t.members?.length || 0} pemain)\n`
    })

    message += `\n_total ${teams.length} tim_\n\n`
    message += `💡 Detail tim: *p tim [nama_tim]*`
    return message
  }

  const searchName = playerName.toLowerCase()
  const result = await apiCall('/api/teams')
  const teams = result.success ? result.data?.data || [] : []

  const playerTeam = teams.find(t => 
    t.members?.some(m => m.user?.name?.toLowerCase().includes(searchName))
  )

  if (!playerTeam) {
    return `🔍 Pemain "${playerName}" tidak ditemukan.\n\nCek daftar tim: *p tim*`
  }

  const member = playerTeam.members?.find(m => 
    m.user?.name?.toLowerCase().includes(searchName)
  )

  let message = `👥 *INFO TIM & PEMAIN*\n\n`
  message += `🎮 *Pemain:* ${member?.user?.name || playerName}\n`
  message += `${getTierEmoji(member?.user?.tier)} Tier: ${member?.user?.tier || 'B'}\n`
  message += `👑 Captain: ${member?.isCaptain ? '✅ Ya' : '❌ Tidak'}\n\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`
  message += `🏷️ *Tim:* ${playerTeam.name}\n`
  message += `${getDivisionEmoji(playerTeam.tournament?.division)} Divisi: ${playerTeam.tournament?.division || '-'}\n`
  message += `🏆 Turnamen: ${playerTeam.tournament?.name || '-'}\n\n`
  
  message += `👤 *Anggota Tim:*\n`
  playerTeam.members?.forEach((m, i) => {
    const captain = m.isCaptain ? ' 👑' : ''
    const tier = getTierEmoji(m.user?.tier)
    message += `${i + 1}. ${tier} ${m.user?.name || 'Unknown'}${captain}\n`
  })

  return message
}

async function handleDaftar(from, args) {
  if (args.length < 2) {
    const tournaments = await apiCall('/api/tournaments?status=REGISTRATION')
    const active = tournaments.success ? tournaments.data?.data || [] : []

    return `📝 *FORMAT PENDAFTARAN*\n\nKetik: p daftar [nama] [divisi]\n\nContoh:\n• p daftar Tazos male\n• p daftar Luna female\n• p daftar Alpha liga\n\nDivisi tersedia:\n• male - Male Division (3vs3)\n• female - Female Division (3vs3)\n• liga - Liga IDM (5vs5)\n\n🏆 *Turnamen Buka Pendaftaran:*\n${active.length > 0 ? active.map(t => `${getDivisionEmoji(t.division)} ${t.name}`).join('\n') : 'Tidak ada turnamen buka pendaftaran'}`
  }

  const name = args[0]
  const division = args[1].toUpperCase()

  if (!['MALE', 'FEMALE', 'LIGA'].includes(division)) {
    return `❌ Divisi tidak valid!\n\nPilih: male, female, atau liga`
  }

  const tournamentResult = await apiCall(`/api/tournaments?division=${division}&status=REGISTRATION`)
  const tournament = tournamentResult.success ? tournamentResult.data?.data?.[0] : null

  if (!tournament) {
    return `❌ Tidak ada turnamen ${getDivisionEmoji(division)} ${division} yang buka pendaftaran.`
  }

  pendingRegistrations.set(from, {
    phone: from,
    name,
    division,
    tournamentId: tournament.id,
    step: 'tier'
  })

  return `📝 *KONFIRMASI PENDAFTARAN*\n\nTurnamen: ${tournament.name}\nNama: ${name}\nDivisi: ${getDivisionEmoji(division)} ${division}\n\nPilih tier Anda:\n• S - Pro Player\n• A - Experienced\n• B - Beginner\n\nKetik tier (S/A/B):`
}

async function handleHasil(division) {
  const div = division?.toUpperCase() || null
  
  const endpoint = div 
    ? `/api/tournaments?division=${div}&status=COMPLETED`
    : '/api/tournaments?status=COMPLETED'
  
  const result = await apiCall(endpoint)
  const tournaments = result.success ? result.data?.data || [] : []

  if (tournaments.length === 0) {
    return `🏆 *HASIL TURNAMEN*\n\nBelum ada turnamen yang selesai.\n\nCek hasil per divisi:\n• p hasil male\n• p hasil female\n• p hasil liga`
  }

  let message = `🏆 *HASIL TURNAMEN*\n\n`

  for (const t of tournaments.slice(0, 3)) {
    message += `${getDivisionEmoji(t.division)} *${t.name}*\n`
    
    if (t.champion) {
      const teamResult = await apiCall('/api/teams')
      const allTeams = teamResult.success ? teamResult.data?.data || [] : []
      const championTeam = allTeams.find(team => team.id === t.champion.championTeamId)
      
      let membersStr = ''
      if (championTeam?.members && championTeam.members.length > 0) {
        const memberNames = championTeam.members.map(m => m.user?.name || 'Unknown')
        membersStr = ` (${memberNames.join(', ')})`
      }
      
      message += `🥇 Champion: ${t.champion.championTeam?.name || 'TBD'}${membersStr}\n`
      
      if (t.prizePool) {
        message += `💰 Prize: ${formatRupiah(t.prizePool.totalAmount)}\n`
      }
    }
    message += `\n`
  }

  message += `🔗 Detail lengkap: ${WEB_URL}`
  return message
}

async function handlePeserta() {
  const result = await apiCall('/api/registrations?status=APPROVED')
  const registrations = result.success ? result.data?.data || [] : []

  if (registrations.length === 0) {
    return `📝 Belum ada peserta terdaftar.`
  }

  const grouped = {}
  registrations.forEach(r => {
    const div = r.division || r.tournament?.division || 'OTHER'
    if (!grouped[div]) grouped[div] = []
    grouped[div].push(r)
  })

  let message = `📝 *PESERTA TERDAFTAR*\n\n`

  Object.entries(grouped).forEach(([div, regs]) => {
    message += `${getDivisionEmoji(div)} *${div}*\n`
    regs.slice(0, 8).forEach(r => {
      const tier = getTierEmoji(r.tier)
      message += `${tier} ${r.user?.name || r.name}\n`
    })
    if (regs.length > 8) message += `...dan ${regs.length - 8} lainnya\n`
    message += `\n`
  })

  message += `Total: ${registrations.length} peserta`
  return message
}

function handleHelp() {
  return `📚 *PANDUAN BOT IDM TOURNAMENT*
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
• p top - Leaderboard
• p tim [nama] - Info tim/pemain

💰 *LAINNYA*
• p donasi [jumlah] [pesan]
• p notif on/off

━━━━━━━━━━━━━━━━━━━━
🎮 *IDOL META FAN MADE EDITION*
📞 +6281349924210
🌐 ${WEB_URL}`
}

async function handleRegistrationStep(from, message, pending) {
  const response = message.toLowerCase().trim()

  if (pending.step === 'tier') {
    if (['s', 'a', 'b'].includes(response)) {
      pending.tier = response.toUpperCase()
    }
    pending.step = 'confirm'
    
    return `📝 *KONFIRMASI PENDAFTARAN*\n\nNama: ${pending.name}\nDivisi: ${getDivisionEmoji(pending.division)} ${pending.division}\nTier: ${getTierEmoji(pending.tier)} ${pending.tier || 'Akan ditentukan admin'}\n\nBalas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`
  }

  if (pending.step === 'confirm') {
    if (response === 'ya' || response === 'yes' || response === 'y') {
      const result = await apiCall('/api/registrations', 'POST', {
        tournamentId: pending.tournamentId,
        name: pending.name,
        phone: from,
        division: pending.division,
        tier: pending.tier
      })
      
      pendingRegistrations.delete(from)
      
      if (result.success) {
        return `🎉 *PENDAFTARAN BERHASIL!*\n\nNama: ${pending.name}\nDivisi: ${getDivisionEmoji(pending.division)} ${pending.division}\n\n✅ Anda akan menerima notifikasi saat pendaftaran disetujui.\n\n💡 Ketik *p notif on* untuk mengaktifkan notifikasi.`
      } else {
        return `❌ Pendaftaran gagal: ${result.data?.error || 'Terjadi kesalahan'}\n\nCoba lagi atau hubungi admin.`
      }
    }

    if (response === 'batal' || response === 'no' || response === 'n') {
      pendingRegistrations.delete(from)
      return `❌ Pendaftaran dibatalkan.`
    }
  }

  return `Balas *ya* untuk konfirmasi atau *batal* untuk membatalkan.`
}

// ========================================
// MAIN MESSAGE HANDLER
// ========================================

async function handleMessage(from, message, senderName, isGroup) {
  const { command, args } = parseCommand(message)

  // Handle multi-step flows
  const pending = pendingRegistrations.get(from)
  if (pending && !['batal', 'cancel'].includes(command)) {
    return handleRegistrationStep(from, message, pending)
  }

  // Handle commands
  switch (command) {
    case 'jadwal':
      return handleJadwal()

    case 'top':
    case 'ranking':
    case 'leaderboard':
      return handleTopGlobal()

    case 'bracket':
      return handleBracket(args[0])

    case 'info':
      return handleInfo()

    case 'tim':
    case 'team':
      return handleTim(args.join(' '))

    case 'daftar':
    case 'register':
      return handleDaftar(from, args)

    case 'hasil':
    case 'result':
      return handleHasil(args[0])

    case 'peserta':
    case 'participants':
      return handlePeserta()

    case 'help':
    case 'bantuan':
    case 'menu':
      return handleHelp()

    case 'notif':
      const action = args[0]?.toLowerCase()
      if (action === 'on') {
        notificationSubscriptions.set(from, true)
        return `🔔 *NOTIFIKASI AKTIF*\n\nAnda akan menerima notifikasi untuk:\n• Jadwal pertandingan\n• Update turnamen\n\nKetik *p notif off* untuk menonaktifkan.`
      }
      if (action === 'off') {
        notificationSubscriptions.delete(from)
        return `🔕 Notifikasi dinonaktifkan.`
      }
      const isSubscribed = notificationSubscriptions.has(from)
      return `🔔 *PENGATURAN NOTIFIKASI*\n\nStatus: ${isSubscribed ? '✅ Aktif' : '❌ Tidak Aktif'}\n\nKetik:\n• p notif on - Aktifkan\n• p notif off - Nonaktifkan`

    default:
      if (isGroup) {
        return null // Silent ignore in groups
      }
      return `👋 Hai! Saya bot *Idol Meta Tournament*.\n\nKetik *p help* untuk melihat daftar perintah.\n\n🎮 Daftar sekarang: p daftar [nama] [divisi]`
  }
}

// ========================================
// MAIN BOT - BAILEYS
// ========================================

async function startBot() {
  // Use auth state for session persistence
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  
  // Create socket connection
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['IDM Bot', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 1000,
    maxMsgRetryCount: 5
  })

  // QR Code handler - display in terminal
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    // Show QR code in terminal
    if (qr) {
      console.log('\n📱 Scan QR Code berikut dengan WhatsApp:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      qrcode.generate(qr, { small: true })
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Buka WhatsApp → Menu → Perangkat tertaut → Scan')
    }
    
    // Handle connection close
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('\n❌ Connection closed. Reason:', lastDisconnect?.error?.output?.statusCode)
      
      if (shouldReconnect) {
        console.log('🔄 Reconnecting...')
        setTimeout(() => startBot(), 3000)
      }
    }
    
    // Connected successfully
    if (connection === 'open') {
      console.log('\n✅ Bot WhatsApp berhasil terhubung!')
      console.log('📱 Bot siap menerima dan mengirim pesan.')
      console.log('💡 Ketik "p help" di WhatsApp untuk melihat daftar perintah.\n')
    }
  })

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds)

  // Message handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    
    // Skip if no message or not from user
    if (!msg?.message || msg.key.fromMe || m.type !== 'notify') return
    
    // Get message content
    const messageContent = msg.message.conversation || 
                          msg.message.extendedTextMessage?.text || ''
    
    if (!messageContent) return
    
    const from = msg.key.remoteJid
    const senderName = msg.pushName || 'Unknown'
    const isGroup = from.endsWith('@g.us')
    
    console.log(`📩 [${isGroup ? 'GROUP' : 'PRIVATE'}] ${senderName}: ${messageContent}`)
    
    try {
      const response = await handleMessage(from, messageContent, senderName, isGroup)
      
      if (response) {
        // Send response with typing indicator
        await sock.presenceSubscribe(from)
        await sock.sendPresenceUpdate('composing', from)
        
        await sock.sendMessage(from, { text: response })
        
        await sock.sendPresenceUpdate('paused', from)
        console.log(`📤 Sent response to ${senderName}`)
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
    }
  })

  return sock
}

// ========================================
// START
// ========================================

console.log('\n🤖 IDM WhatsApp Bot - Baileys Version')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`🌐 API Base: ${API_BASE}`)
console.log(`🌐 Web URL: ${WEB_URL}`)
console.log('📝 Ketik "p help" untuk daftar perintah')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

startBot().catch(console.error)
