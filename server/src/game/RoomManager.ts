import { randomUUID } from 'crypto';
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  PLAYER_COLORS,
  ROOM_CODE_LENGTH,
  clampPlayerCount,
  isValidPlayerCount,
  type MaxPlayers,
  type Player,
  type RoomState,
} from '@typing-race/shared';

const rooms = new Map<string, RoomState>();
const playerToRoom = new Map<string, string>();
const sessionToPlayer = new Map<string, { roomCode: string; player: Player }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function assignColor(players: Player[]): string {
  const used = new Set(players.map((p) => p.color));
  return PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[players.length % PLAYER_COLORS.length];
}

function resolveSessionId(sessionId?: string): string {
  return sessionId && sessionId.length >= 8 ? sessionId : randomUUID();
}

export class RoomManager {
  createRoom(
    socketId: string,
    displayName: string,
    maxPlayers: MaxPlayers,
    sessionId?: string
  ): RoomState {
    if (!isValidPlayerCount(maxPlayers)) {
      throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }
    const resolvedMax = clampPlayerCount(maxPlayers);
    const resolvedSession = resolveSessionId(sessionId);
    const roomCode = generateRoomCode();
    const host: Player = {
      id: socketId,
      sessionId: resolvedSession,
      name: displayName.trim().slice(0, 20) || 'Host',
      color: PLAYER_COLORS[0],
      ready: false,
      connected: true,
    };

    const room: RoomState = {
      roomCode,
      maxPlayers: resolvedMax,
      hostId: socketId,
      status: 'lobby',
      players: [host],
      currentRound: null,
      roundResults: [],
      liveProgress: [],
      finalStandings: null,
    };

    rooms.set(roomCode, room);
    playerToRoom.set(socketId, roomCode);
    sessionToPlayer.set(resolvedSession, { roomCode, player: host });
    return room;
  }

  joinRoom(
    socketId: string,
    roomCode: string,
    displayName: string,
    sessionId?: string
  ): RoomState {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.status === 'finished') throw new Error('Game has ended');

    const existing = sessionId ? sessionToPlayer.get(sessionId) : undefined;
    if (sessionId && existing && existing.roomCode === code) {
      const oldPlayer = room.players.find((p) => p.sessionId === sessionId);
      if (oldPlayer) {
        const updated: Player = {
          ...oldPlayer,
          id: socketId,
          connected: true,
          name: displayName.trim().slice(0, 20) || oldPlayer.name,
        };
        const idx = room.players.findIndex((p) => p.sessionId === sessionId);
        room.players[idx] = updated;
        playerToRoom.set(socketId, code);
        sessionToPlayer.set(sessionId, { roomCode: code, player: updated });
        if (room.hostId === oldPlayer.id) room.hostId = socketId;
        return room;
      }
    }

    if (room.status !== 'lobby') throw new Error('Game already started');
    if (room.players.length >= room.maxPlayers) throw new Error('Room is full');

    const resolvedSession = resolveSessionId(sessionId);
    const player: Player = {
      id: socketId,
      sessionId: resolvedSession,
      name: displayName.trim().slice(0, 20) || 'Player',
      color: assignColor(room.players),
      ready: false,
      connected: true,
    };

    room.players.push(player);
    playerToRoom.set(socketId, code);
    sessionToPlayer.set(resolvedSession, { roomCode: code, player });
    return room;
  }

  leaveRoom(socketId: string): RoomState | null {
    const roomCode = playerToRoom.get(socketId);
    if (!roomCode) return null;

    const room = rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find((p) => p.id === socketId);
    if (!player) return null;

    if (room.status === 'playing') {
      player.connected = false;
      sessionToPlayer.set(player.sessionId, { roomCode, player: { ...player, connected: false } });
      return room;
    }

    room.players = room.players.filter((p) => p.id !== socketId);
    playerToRoom.delete(socketId);
    sessionToPlayer.delete(player.sessionId);

    if (room.players.length === 0) {
      rooms.delete(roomCode);
      return null;
    }

    if (room.hostId === socketId) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  getRoomByCode(roomCode: string): RoomState | undefined {
    return rooms.get(roomCode.toUpperCase());
  }

  getRoomByPlayer(socketId: string): RoomState | undefined {
    const code = playerToRoom.get(socketId);
    return code ? rooms.get(code) : undefined;
  }

  setMaxPlayers(socketId: string, maxPlayers: MaxPlayers): RoomState {
    const room = this.getRoomByPlayer(socketId);
    if (!room) throw new Error('Not in a room');
    if (room.hostId !== socketId) throw new Error('Only host can change player count');
    if (room.status !== 'lobby') throw new Error('Cannot change after game started');
    if (!isValidPlayerCount(maxPlayers)) {
      throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }
    const resolvedMax = clampPlayerCount(maxPlayers);
    if (room.players.length > resolvedMax) throw new Error('Too many players in room');

    room.maxPlayers = resolvedMax;
    return room;
  }

  setReady(socketId: string, ready: boolean): RoomState {
    const room = this.getRoomByPlayer(socketId);
    if (!room) throw new Error('Not in a room');

    const player = room.players.find((p) => p.id === socketId);
    if (!player) throw new Error('Player not found');

    player.ready = ready;
    return room;
  }

  canStart(room: RoomState): boolean {
    const connected = room.players.filter((p) => p.connected);
    return (
      connected.length >= MIN_PLAYERS &&
      connected.every((p) => p.ready)
    );
  }

  updateRoom(room: RoomState): void {
    rooms.set(room.roomCode, room);
  }
}

export const roomManager = new RoomManager();
