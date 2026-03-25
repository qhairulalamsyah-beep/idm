// Socket.IO Client for Backend API
// Used to emit events to the WebSocket service from API routes

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    socket = io('http://localhost:3003', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[SocketClient] Connected to WebSocket service');
    });

    socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error.message);
    });

    socket.on('disconnect', () => {
      console.log('[SocketClient] Disconnected from WebSocket service');
    });
  }

  return socket;
}

// Emit score update event
export function emitScoreUpdate(data: {
  matchId: string;
  tournamentId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerId?: string;
}) {
  const socket = getSocketClient();
  socket.emit('score-update', data);
}

// Emit bracket generated event
export function emitBracketGenerated(data: {
  tournamentId: string;
  bracket: unknown;
}) {
  const socket = getSocketClient();
  socket.emit('bracket-generated', data);
}

// Emit teams generated event
export function emitTeamsGenerated(data: {
  tournamentId: string;
  teams: unknown[];
}) {
  const socket = getSocketClient();
  socket.emit('teams-generated', data);
}

// Emit tournament status change
export function emitTournamentStatus(data: {
  tournamentId: string;
  status: string;
}) {
  const socket = getSocketClient();
  socket.emit('tournament-status', data);
}
