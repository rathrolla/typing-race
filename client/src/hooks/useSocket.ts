import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientEvents,
  ServerEvents,
  type ClientRoomState,
  type GameOverPayload,
  type RoundEndPayload,
  type RoundStartPayload,
  type RoundTickPayload,
} from '@typing-race/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3002';
import { getOrCreateSessionId } from '../lib/sessionId';

export interface GameState {
  room: ClientRoomState | null;
  roundWord: string | null;
  remainingMs: number;
  roundStartedAt: number;
  timeoutMs: number;
  lastRoundResult: RoundEndPayload | null;
  gameOver: GameOverPayload | null;
  error: string | null;
  connected: boolean;
}

const initialState: GameState = {
  room: null,
  roundWord: null,
  remainingMs: 0,
  roundStartedAt: 0,
  timeoutMs: 0,
  lastRoundResult: null,
  gameOver: null,
  error: null,
  connected: false,
};

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<GameState>(initialState);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState((s) => ({ ...s, connected: true, error: null }));
    });

    socket.on('disconnect', () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on('connect_error', () => {
      setState((s) => ({
        ...s,
        connected: false,
        error: `Cannot reach game server at ${SOCKET_URL}. Run "npm run dev:lan" on the host machine.`,
      }));
    });

    socket.on(ServerEvents.ROOM_STATE, (room: ClientRoomState) => {
      setState((s) => ({
        ...s,
        room,
        gameOver: room.status === 'finished' ? s.gameOver : null,
      }));
    });

    socket.on(ServerEvents.ROUND_START, (payload: RoundStartPayload) => {
      setState((s) => ({
        ...s,
        roundWord: payload.word,
        remainingMs: payload.timeoutMs,
        roundStartedAt: payload.startedAt,
        timeoutMs: payload.timeoutMs,
        lastRoundResult: null,
        gameOver: null,
      }));
    });

    socket.on(ServerEvents.ROUND_TICK, (payload: RoundTickPayload) => {
      setState((s) => ({ ...s, remainingMs: payload.remainingMs }));
    });

    socket.on(ServerEvents.ROUND_END, (payload: RoundEndPayload) => {
      setState((s) => ({
        ...s,
        lastRoundResult: payload,
        roundWord: null,
      }));
    });

    socket.on(ServerEvents.GAME_OVER, (payload: GameOverPayload) => {
      setState((s) => ({
        ...s,
        gameOver: payload,
        roundWord: null,
        lastRoundResult: null,
      }));
    });

    socket.on(ServerEvents.ERROR, (payload: { message: string }) => {
      setState((s) => ({ ...s, error: payload.message }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const createRoom = useCallback((displayName: string, maxPlayers: 4 | 8) => {
    socketRef.current?.emit(ClientEvents.ROOM_CREATE, {
      displayName,
      maxPlayers,
      sessionId: getOrCreateSessionId(),
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, displayName: string) => {
    socketRef.current?.emit(ClientEvents.ROOM_JOIN, {
      roomCode,
      displayName,
      sessionId: getOrCreateSessionId(),
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit(ClientEvents.ROOM_LEAVE);
    setState(initialState);
  }, []);

  const setMaxPlayers = useCallback((maxPlayers: 4 | 8) => {
    socketRef.current?.emit(ClientEvents.ROOM_SET_MAX_PLAYERS, { maxPlayers });
  }, []);

  const setReady = useCallback((ready: boolean) => {
    socketRef.current?.emit(ClientEvents.PLAYER_READY, { ready });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit(ClientEvents.GAME_START);
  }, []);

  const sendProgress = useCallback((charsCorrect: number) => {
    socketRef.current?.emit(ClientEvents.PLAYER_PROGRESS, { charsCorrect });
  }, []);

  const submitWord = useCallback((typed: string, clientElapsedMs: number) => {
    socketRef.current?.emit(ClientEvents.ROUND_SUBMIT, { typed, clientElapsedMs });
  }, []);

  return {
    state,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
    setMaxPlayers,
    setReady,
    startGame,
    sendProgress,
    submitWord,
  };
}
