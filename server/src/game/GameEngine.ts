import {
  ClientEvents,
  getRoundLengths,
  getTimeoutMs,
  ROUND_REVEAL_MS,
  ServerEvents,
  calculateWpm,
  computeStandings,
  rankRoundResults,
  sanitizeRoomForClient,
  type PlayerProgress,
  type RoomState,
  type RoundResult,
} from '@typing-race/shared';
import type { Server, Socket } from 'socket.io';
import { fetchChallenge, resetWordCache } from '../words/fetchWord.js';
import { roomManager } from './RoomManager.js';

interface ActiveRound {
  progress: Map<string, PlayerProgress>;
  tickInterval: ReturnType<typeof setInterval>;
  endTimeout: ReturnType<typeof setTimeout>;
}

const activeRounds = new Map<string, ActiveRound>();

function initProgress(room: RoomState): Map<string, PlayerProgress> {
  const progress = new Map<string, PlayerProgress>();
  for (const player of room.players) {
    progress.set(player.id, {
      playerId: player.id,
      charsCorrect: 0,
      finished: false,
      finishTimeMs: null,
      wpm: null,
    });
  }
  return progress;
}

function broadcastRoom(io: Server, room: RoomState, revealWord = false): void {
  for (const player of room.players) {
    const socket = io.sockets.sockets.get(player.id);
    if (socket) {
      socket.emit(ServerEvents.ROOM_STATE, sanitizeRoomForClient(room, player.id, revealWord));
    }
  }
}

function emitToRoom(io: Server, roomCode: string, event: string, payload: unknown): void {
  const room = roomManager.getRoomByCode(roomCode);
  if (!room) return;
  for (const player of room.players) {
    io.to(player.id).emit(event, payload);
  }
}

export class GameEngine {
  async startGame(io: Server, socket: Socket, room: RoomState): Promise<void> {
    if (!roomManager.canStart(room)) {
      socket.emit(ServerEvents.ERROR, { message: 'Need at least 2 players and everyone ready' });
      return;
    }

    resetWordCache();
    room.status = 'playing';
    room.roundResults = [];
    room.finalStandings = null;
    room.liveProgress = [];
    roomManager.updateRoom(room);
    broadcastRoom(io, room);

    await this.startRound(io, room, 0);
  }

  async startRound(io: Server, room: RoomState, roundIndex: number): Promise<void> {
    const roundLengths = getRoundLengths(room.typingMode);
    if (roundIndex >= roundLengths.length) {
      await this.endGame(io, room);
      return;
    }

    const roundLength = roundLengths[roundIndex];
    const word = await fetchChallenge(roundLength, room.typingMode);
    const wordLength = word.length;
    const timeoutMs = getTimeoutMs(wordLength, room.typingMode);
    const revealedAt = Date.now();
    const startedAt = revealedAt + ROUND_REVEAL_MS;
    const endsAt = startedAt + timeoutMs;

    const progress = initProgress(room);

    room.currentRound = {
      roundIndex,
      wordLength,
      word,
      startedAt,
      endsAt,
      timeoutMs,
    };
    room.liveProgress = [...progress.values()];
    roomManager.updateRoom(room);

    const roundStartPayload = {
      roundIndex,
      wordLength,
      word,
      startedAt,
      endsAt,
      timeoutMs,
    };

    emitToRoom(io, room.roomCode, ServerEvents.ROUND_START, roundStartPayload);
    broadcastRoom(io, room, true);

    const tickInterval = setInterval(() => {
      const now = Date.now();
      const remainingMs =
        now < startedAt ? timeoutMs : Math.max(0, endsAt - now);
      emitToRoom(io, room.roomCode, ServerEvents.ROUND_TICK, { remainingMs, endsAt });
      if (remainingMs <= 0 && now >= startedAt) clearInterval(tickInterval);
    }, 100);

    const endTimeout = setTimeout(() => {
      void this.endRound(io, room.roomCode, roundIndex);
    }, ROUND_REVEAL_MS + timeoutMs);

    activeRounds.set(room.roomCode, { progress, tickInterval, endTimeout });
  }

  handleProgress(room: RoomState, socketId: string, charsCorrect: number): void {
    const active = activeRounds.get(room.roomCode);
    if (!active || !room.currentRound) return;
    if (Date.now() < room.currentRound.startedAt) return;

    const entry = active.progress.get(socketId);
    if (!entry || entry.finished) return;

    entry.charsCorrect = Math.min(charsCorrect, room.currentRound.word.length);
    room.liveProgress = [...active.progress.values()];
    roomManager.updateRoom(room);
  }

  handleSubmit(
    io: Server,
    room: RoomState,
    socketId: string,
    typed: string,
    clientElapsedMs: number
  ): void {
    const active = activeRounds.get(room.roomCode);
    if (!active || !room.currentRound) return;
    if (Date.now() < room.currentRound.startedAt) return;

    const entry = active.progress.get(socketId);
    if (!entry || entry.finished) return;

    const normalized = typed.trim();
    if (normalized !== room.currentRound.word) return;

    const finishTimeMs = room.currentRound.startedAt + Math.min(
      clientElapsedMs,
      room.currentRound.endsAt - room.currentRound.startedAt
    );

    entry.finished = true;
    entry.finishTimeMs = finishTimeMs;
    entry.charsCorrect = room.currentRound.word.length;
    entry.wpm = calculateWpm(room.currentRound.word.length, finishTimeMs - room.currentRound.startedAt);
    room.liveProgress = [...active.progress.values()];
    roomManager.updateRoom(room);

    const allFinished = [...active.progress.values()].every((p) => p.finished);
    if (allFinished) {
      void this.endRound(io, room.roomCode, room.currentRound.roundIndex);
    }
  }

  async endRound(io: Server, roomCode: string, roundIndex: number): Promise<void> {
    const room = roomManager.getRoomByCode(roomCode);
    const active = activeRounds.get(roomCode);
    if (!room || !active || !room.currentRound || room.currentRound.roundIndex !== roundIndex) {
      return;
    }

    clearInterval(active.tickInterval);
    clearTimeout(active.endTimeout);
    activeRounds.delete(roomCode);

    const rankings = rankRoundResults(
      room.players.filter((p) => p.connected),
      active.progress,
      room.currentRound.wordLength,
      room.currentRound.startedAt,
      room.currentRound.endsAt
    );

    const result: RoundResult = {
      roundIndex,
      wordLength: room.currentRound.wordLength,
      word: room.currentRound.word,
      rankings,
    };

    room.roundResults.push(result);
    const standings = computeStandings(room.players, room.roundResults);
    room.currentRound = null;
    room.liveProgress = [];
    roomManager.updateRoom(room);

    emitToRoom(io, roomCode, ServerEvents.ROUND_END, { result, standings });
    broadcastRoom(io, room);

    setTimeout(() => {
      void this.startRound(io, room, roundIndex + 1);
    }, 2500);
  }

  async endGame(io: Server, room: RoomState): Promise<void> {
    room.status = 'finished';
    room.currentRound = null;
    room.finalStandings = computeStandings(room.players, room.roundResults);
    roomManager.updateRoom(room);

    emitToRoom(io, room.roomCode, ServerEvents.GAME_OVER, {
      standings: room.finalStandings,
      roundResults: room.roundResults,
    });
    broadcastRoom(io, room);
  }

  playAgain(io: Server, room: RoomState): void {
    this.cleanupRoom(room.roomCode);
    const reset = roomManager.resetToLobby(room.roomCode);
    if (!reset) return;
    roomManager.updateRoom(reset);
    broadcastRoom(io, reset);
  }

  cleanupRoom(roomCode: string): void {
    const active = activeRounds.get(roomCode);
    if (active) {
      clearInterval(active.tickInterval);
      clearTimeout(active.endTimeout);
      activeRounds.delete(roomCode);
    }
  }
}

export const gameEngine = new GameEngine();

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvents.ROOM_CREATE, (payload: { maxPlayers: number; displayName: string; sessionId?: string }) => {
    try {
      const room = roomManager.createRoom(socket.id, payload.displayName, payload.maxPlayers, payload.sessionId);
      socket.join(room.roomCode);
      socket.emit(ServerEvents.ROOM_STATE, sanitizeRoomForClient(room, socket.id, false));
    } catch (err) {
      socket.emit(ServerEvents.ERROR, { message: err instanceof Error ? err.message : 'Failed to create room' });
    }
  });

  socket.on(ClientEvents.ROOM_JOIN, (payload: { roomCode: string; displayName: string; sessionId?: string }) => {
    try {
      const room = roomManager.joinRoom(socket.id, payload.roomCode, payload.displayName, payload.sessionId);
      socket.join(room.roomCode);
      broadcastRoom(io, room, room.status === 'playing');
    } catch (err) {
      socket.emit(ServerEvents.ERROR, { message: err instanceof Error ? err.message : 'Failed to join room' });
    }
  });

  socket.on(ClientEvents.ROOM_LEAVE, () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    const updated = roomManager.leaveRoom(socket.id);
    if (room) {
      gameEngine.cleanupRoom(room.roomCode);
      socket.leave(room.roomCode);
      if (updated) broadcastRoom(io, updated, updated.status === 'playing');
    }
  });

  socket.on(ClientEvents.ROOM_SET_MAX_PLAYERS, (payload: { maxPlayers: number }) => {
    try {
      const room = roomManager.setMaxPlayers(socket.id, payload.maxPlayers);
      broadcastRoom(io, room, false);
    } catch (err) {
      socket.emit(ServerEvents.ERROR, { message: err instanceof Error ? err.message : 'Failed to update room' });
    }
  });

  socket.on(ClientEvents.ROOM_SET_TYPING_MODE, (payload: { typingMode: import('@typing-race/shared').TypingMode }) => {
    try {
      const room = roomManager.setTypingMode(socket.id, payload.typingMode);
      broadcastRoom(io, room, false);
    } catch (err) {
      socket.emit(ServerEvents.ERROR, { message: err instanceof Error ? err.message : 'Failed to update typing mode' });
    }
  });

  socket.on(ClientEvents.PLAYER_READY, (payload: { ready: boolean }) => {
    try {
      const room = roomManager.setReady(socket.id, payload.ready);
      broadcastRoom(io, room, false);
    } catch (err) {
      socket.emit(ServerEvents.ERROR, { message: err instanceof Error ? err.message : 'Failed to set ready' });
    }
  });

  socket.on(ClientEvents.GAME_PLAY_AGAIN, () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      socket.emit(ServerEvents.ERROR, { message: 'Not in a room' });
      return;
    }
    if (room.status !== 'finished') {
      socket.emit(ServerEvents.ERROR, { message: 'Game is still in progress' });
      return;
    }
    gameEngine.playAgain(io, room);
  });

  socket.on(ClientEvents.GAME_START, () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      socket.emit(ServerEvents.ERROR, { message: 'Not in a room' });
      return;
    }
    if (room.hostId !== socket.id) {
      socket.emit(ServerEvents.ERROR, { message: 'Only host can start the game' });
      return;
    }
    void gameEngine.startGame(io, socket, room);
  });

  socket.on(ClientEvents.PLAYER_PROGRESS, (payload: { charsCorrect: number }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;
    gameEngine.handleProgress(room, socket.id, payload.charsCorrect);
    broadcastRoom(io, room, true);
  });

  socket.on(ClientEvents.ROUND_SUBMIT, (payload: { typed: string; clientElapsedMs: number }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;
    gameEngine.handleSubmit(io, room, socket.id, payload.typed, payload.clientElapsedMs);
    broadcastRoom(io, room, true);
  });

  socket.on('disconnect', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    const updated = roomManager.leaveRoom(socket.id);
    if (updated) {
      broadcastRoom(io, updated, updated.status === 'playing');
    }
  });
}
