import { motion } from 'framer-motion';
import { useState } from 'react';
import { MIN_PLAYERS, type ClientRoomState } from '@typing-race/shared';
import type { useSocket } from '../hooks/useSocket';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayerCountPicker } from '../components/PlayerCountPicker';

interface Props {
  socket: ReturnType<typeof useSocket>;
  room: ClientRoomState;
}

export function LobbyScreen({ socket, room }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = room.playerId === room.hostId;
  const connectedCount = room.players.filter((p) => p.connected).length;
  const allReady = room.players.filter((p) => p.connected).every((p) => p.ready);
  const canStart = isHost && connectedCount >= MIN_PLAYERS && allReady;

  const me = room.players.find((p) => p.id === room.playerId);

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emptySlots = room.maxPlayers - room.players.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 md:p-10"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Room Code</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-5xl font-bold tracking-[0.25em] text-cyan-300">
                {room.roomCode}
              </span>
              <button
                onClick={copyCode}
                className="btn-secondary text-sm py-2 px-4"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {isHost && (
            <div>
              <p className="text-slate-400 text-sm mb-2">Max players</p>
              <PlayerCountPicker
                value={room.maxPlayers}
                onChange={(n) => socket.setMaxPlayers(n)}
                minAllowed={room.players.length}
                compact
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {room.players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`panel p-4 ${!player.connected ? 'opacity-50' : ''}`}
              style={{ borderColor: `${player.color}40` }}
            >
              <PlayerAvatar player={player} size="lg" />
              <p className="mt-3 font-semibold truncate">{player.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {player.id === room.hostId ? 'Host' : 'Player'}
                {!player.connected && ' · Offline'}
              </p>
              {player.ready && (
                <span className="inline-block mt-2 text-xs font-medium text-green-400">Ready</span>
              )}
            </motion.div>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
              className="panel p-4 border-dashed flex items-center justify-center min-h-[120px]"
            >
              <span className="text-slate-500 text-sm">Waiting...</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {me && (
            <button
              className={`btn-secondary min-w-[160px] ${me.ready ? 'border-green-400 text-green-300' : ''}`}
              onClick={() => socket.setReady(!me.ready)}
            >
              {me.ready ? 'Unready' : 'Ready Up'}
            </button>
          )}

          {isHost && (
            <button
              className="btn-primary min-w-[160px]"
              disabled={!canStart}
              onClick={() => socket.startGame()}
            >
              Start Game
            </button>
          )}

          <button className="text-slate-400 hover:text-white text-sm" onClick={() => socket.leaveRoom()}>
            Leave room
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {connectedCount}/{room.maxPlayers} players ·{' '}
          {canStart
            ? 'Everyone ready — start when you are!'
            : connectedCount < MIN_PLAYERS
              ? `Need at least ${MIN_PLAYERS} players to start`
              : 'Waiting for everyone to ready up'}
        </p>
      </div>
    </motion.div>
  );
}
