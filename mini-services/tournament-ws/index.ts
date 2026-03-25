// Tournament WebSocket Service
// Real-time updates for brackets, matches, and scores

import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = 3003;

// Tournament state cache
const tournamentStates = new Map<string, {
  matches: Map<string, MatchState>;
  connectedUsers: Set<string>;
}>();

interface MatchState {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  winnerId?: string;
}

interface ScoreUpdate {
  matchId: string;
  tournamentId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerId?: string;
}

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://chat.z.ai'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Connection handling
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Join tournament room
  socket.on('join-tournament', (tournamentId: string) => {
    socket.join(`tournament:${tournamentId}`);
    console.log(`[WS] Client ${socket.id} joined tournament ${tournamentId}`);
    
    // Send current state
    const state = tournamentStates.get(tournamentId);
    if (state) {
      socket.emit('tournament-state', {
        tournamentId,
        matches: Array.from(state.matches.values()),
      });
    }
  });

  // Leave tournament room
  socket.on('leave-tournament', (tournamentId: string) => {
    socket.leave(`tournament:${tournamentId}`);
    console.log(`[WS] Client ${socket.id} left tournament ${tournamentId}`);
  });

  // Join admin room for tournament management
  socket.on('join-admin', (adminId: string) => {
    socket.join(`admin:${adminId}`);
    console.log(`[WS] Admin ${adminId} connected`);
  });

  // Handle score updates from admin
  socket.on('score-update', async (data: ScoreUpdate) => {
    console.log(`[WS] Score update: Match ${data.matchId} - ${data.homeScore}:${data.awayScore}`);
    
    // Update match state
    let state = tournamentStates.get(data.tournamentId);
    if (!state) {
      state = {
        matches: new Map(),
        connectedUsers: new Set(),
      };
      tournamentStates.set(data.tournamentId, state);
    }

    state.matches.set(data.matchId, {
      id: data.matchId,
      tournamentId: data.tournamentId,
      homeTeamId: '',
      awayTeamId: '',
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: data.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
      winnerId: data.winnerId,
    });

    // Broadcast to all clients in the tournament room
    io.to(`tournament:${data.tournamentId}`).emit('match-updated', {
      matchId: data.matchId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: data.status,
      winnerId: data.winnerId,
      timestamp: Date.now(),
    });
  });

  // Handle match start
  socket.on('match-start', (data: { matchId: string; tournamentId: string }) => {
    console.log(`[WS] Match started: ${data.matchId}`);
    
    io.to(`tournament:${data.tournamentId}`).emit('match-started', {
      matchId: data.matchId,
      timestamp: Date.now(),
    });
  });

  // Handle bracket generation
  socket.on('bracket-generated', (data: { tournamentId: string; bracket: unknown }) => {
    console.log(`[WS] Bracket generated for tournament ${data.tournamentId}`);
    
    io.to(`tournament:${data.tournamentId}`).emit('bracket-ready', {
      tournamentId: data.tournamentId,
      bracket: data.bracket,
      timestamp: Date.now(),
    });
  });

  // Handle team generation
  socket.on('teams-generated', (data: { tournamentId: string; teams: unknown[] }) => {
    console.log(`[WS] Teams generated for tournament ${data.tournamentId}`);
    
    io.to(`tournament:${data.tournamentId}`).emit('teams-ready', {
      tournamentId: data.tournamentId,
      teams: data.teams,
      timestamp: Date.now(),
    });
  });

  // Handle tournament status change
  socket.on('tournament-status', (data: { tournamentId: string; status: string }) => {
    console.log(`[WS] Tournament ${data.tournamentId} status: ${data.status}`);
    
    io.to(`tournament:${data.tournamentId}`).emit('status-changed', {
      tournamentId: data.tournamentId,
      status: data.status,
      timestamp: Date.now(),
    });
  });

  // Handle new registration
  socket.on('new-registration', (data: { tournamentId: string; participant: unknown }) => {
    console.log(`[WS] New registration for tournament ${data.tournamentId}`);
    
    io.to(`tournament:${data.tournamentId}`).emit('participant-registered', {
      tournamentId: data.tournamentId,
      participant: data.participant,
      timestamp: Date.now(),
    });
  });

  // Handle tournament completion
  socket.on('tournament-completed', (data: { 
    tournamentId: string; 
    champion: string;
    runnerUp: string;
    mvp?: string;
  }) => {
    console.log(`[WS] Tournament ${data.tournamentId} completed!`);
    
    io.to(`tournament:${data.tournamentId}`).emit('tournament-finished', {
      tournamentId: data.tournamentId,
      champion: data.champion,
      runnerUp: data.runnerUp,
      mvp: data.mvp,
      timestamp: Date.now(),
    });
  });

  // Handle donation/saweran
  socket.on('new-donation', (data: { 
    type: 'donation' | 'saweran';
    amount: number;
    from: string;
    tournamentId?: string;
  }) => {
    console.log(`[WS] ${data.type}: ${data.amount} from ${data.from}`);
    
    if (data.tournamentId) {
      io.to(`tournament:${data.tournamentId}`).emit('donation-received', {
        type: data.type,
        amount: data.amount,
        from: data.from,
        timestamp: Date.now(),
      });
    }
    
    // Also broadcast to admin
    io.to('admin:all').emit('donation-received', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Admin namespace for admin-only events
const adminNamespace = io.of('/admin');

adminNamespace.on('connection', (socket) => {
  console.log(`[WS-Admin] Admin connected: ${socket.id}`);

  socket.on('broadcast-notification', (data: { message: string; tournamentId?: string }) => {
    if (data.tournamentId) {
      io.to(`tournament:${data.tournamentId}`).emit('notification', {
        message: data.message,
        timestamp: Date.now(),
      });
    } else {
      io.emit('notification', {
        message: data.message,
        timestamp: Date.now(),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[WS-Admin] Admin disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`[WS] Tournament WebSocket Service running on port ${PORT}`);
  console.log(`[WS] Ready for real-time bracket updates`);
});
