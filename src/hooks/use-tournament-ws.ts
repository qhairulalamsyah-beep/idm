'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface UseTournamentWSOptions {
  tournamentId?: string;
  userId?: string;
  onMatchUpdate?: (data: MatchUpdateData) => void;
  onTournamentState?: (data: TournamentStateData) => void;
  onBracketReady?: (data: BracketData) => void;
  onTeamsReady?: (data: TeamsData) => void;
  onDonationReceived?: (data: DonationData) => void;
  onNotification?: (data: NotificationData) => void;
}

interface MatchUpdateData {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerId?: string;
  timestamp: number;
}

interface TournamentStateData {
  tournamentId: string;
  matches: unknown[];
}

interface BracketData {
  tournamentId: string;
  bracket: unknown;
  timestamp: number;
}

interface TeamsData {
  tournamentId: string;
  teams: unknown[];
  timestamp: number;
}

interface DonationData {
  type: 'donation' | 'saweran';
  amount: number;
  from: string;
  tournamentId?: string;
  timestamp: number;
}

interface NotificationData {
  message: string;
  timestamp: number;
}

export function useTournamentWS({
  tournamentId,
  userId,
  onMatchUpdate,
  onTournamentState,
  onBracketReady,
  onTeamsReady,
  onDonationReceived,
  onNotification,
}: UseTournamentWSOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('[WS] Connected:', socket.id);
      setIsConnected(true);

      // Join tournament room if specified
      if (tournamentId) {
        socket.emit('join-tournament', tournamentId);
      }

      // Join user room for personal notifications
      if (userId) {
        socket.emit('join-user', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error);
      setIsConnected(false);
    });

    // Tournament events
    socket.on('match-updated', (data: MatchUpdateData) => {
      console.log('[WS] Match updated:', data);
      onMatchUpdate?.(data);

      // Show toast notification
      toast.info('Score Updated', {
        description: `Match ${data.matchId}: ${data.homeScore} - ${data.awayScore}`,
      });
    });

    socket.on('tournament-state', (data: TournamentStateData) => {
      console.log('[WS] Tournament state:', data);
      onTournamentState?.(data);
    });

    socket.on('bracket-ready', (data: BracketData) => {
      console.log('[WS] Bracket ready:', data);
      onBracketReady?.(data);

      toast.success('Bracket Generated', {
        description: 'Tournament bracket is now available!',
      });
    });

    socket.on('teams-ready', (data: TeamsData) => {
      console.log('[WS] Teams ready:', data);
      onTeamsReady?.(data);

      toast.success('Teams Generated', {
        description: 'Tournament teams have been created!',
      });
    });

    socket.on('donation-received', (data: DonationData) => {
      console.log('[WS] Donation received:', data);
      onDonationReceived?.(data);

      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.amount);

      toast.success(`${data.type === 'donation' ? 'Donasi' : 'Saweran'} Masuk!`, {
        description: `${data.from} memberikan ${formatted}`,
      });
    });

    socket.on('notification', (data: NotificationData) => {
      console.log('[WS] Notification:', data);
      onNotification?.(data);

      toast.info('Notification', {
        description: data.message,
      });
    });

    socket.on('match-started', (data: { matchId: string; timestamp: number }) => {
      toast.info('Match Started', {
        description: `Match ${data.matchId} is now live!`,
      });
    });

    socket.on('status-changed', (data: { tournamentId: string; status: string; timestamp: number }) => {
      toast.info('Tournament Update', {
        description: `Status changed to: ${data.status}`,
      });
    });

    socket.on('tournament-finished', (data: {
      tournamentId: string;
      champion: string;
      runnerUp: string;
      mvp?: string;
      timestamp: number;
    }) => {
      toast.success('Tournament Completed! 🏆', {
        description: `Champion: ${data.champion}${data.mvp ? ` | MVP: ${data.mvp}` : ''}`,
      });
    });

    // Cleanup
    return () => {
      if (tournamentId) {
        socket.emit('leave-tournament', tournamentId);
      }
      socket.disconnect();
    };
  }, [tournamentId, userId, onMatchUpdate, onTournamentState, onBracketReady, onTeamsReady, onDonationReceived, onNotification]);

  // Emit functions
  const joinTournament = useCallback((id: string) => {
    socketRef.current?.emit('join-tournament', id);
  }, []);

  const leaveTournament = useCallback((id: string) => {
    socketRef.current?.emit('leave-tournament', id);
  }, []);

  const emitScoreUpdate = useCallback((data: {
    matchId: string;
    tournamentId: string;
    homeScore: number;
    awayScore: number;
    status: string;
    winnerId?: string;
  }) => {
    socketRef.current?.emit('score-update', data);
  }, []);

  const emitDonation = useCallback((data: {
    type: 'donation' | 'saweran';
    amount: number;
    from: string;
    tournamentId?: string;
  }) => {
    socketRef.current?.emit('new-donation', data);
  }, []);

  return {
    isConnected,
    joinTournament,
    leaveTournament,
    emitScoreUpdate,
    emitDonation,
  };
}

export default useTournamentWS;
