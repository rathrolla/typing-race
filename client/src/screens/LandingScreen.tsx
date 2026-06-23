import { motion } from 'framer-motion';
import { useState } from 'react';
import type { useSocket } from '../hooks/useSocket';
import { PlayerCountPicker } from '../components/PlayerCountPicker';

interface Props {
  socket: ReturnType<typeof useSocket>;
  onPlaySolo: () => void;
}

export function LandingScreen({ socket, onPlaySolo }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const handleCreate = () => {
    if (!displayName.trim()) return;
    socket.createRoom(displayName.trim(), maxPlayers);
  };

  const handleJoin = () => {
    if (!displayName.trim() || !roomCode.trim()) return;
    socket.joinRoom(roomCode.trim(), displayName.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">
            <span className="text-cyan-400">Typing</span> Race
          </h1>
          <p className="text-slate-400 text-lg">
            Solo practice · vs Computer · 2–8 player online
          </p>
        </motion.div>

        <div className="panel p-8 shadow-2xl shadow-cyan-500/5">
          {mode === 'home' && (
            <div className="space-y-4">
              <button className="btn-primary w-full text-lg" onClick={onPlaySolo}>
                Play Solo
              </button>
              <button className="btn-secondary w-full text-lg" onClick={() => setMode('create')}>
                Create Room
              </button>
              <button className="btn-secondary w-full text-lg" onClick={() => setMode('join')}>
                Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Create a room</h2>
              <input
                className="input-field"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <p className="text-sm text-slate-400">Max players in room</p>
              <PlayerCountPicker value={maxPlayers} onChange={setMaxPlayers} />
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setMode('home')}>
                  Back
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleCreate}
                  disabled={!displayName.trim() || !socket.state.connected}
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Join a room</h2>
              <input
                className="input-field"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <input
                className="input-field uppercase tracking-[0.3em] text-center text-xl"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setMode('home')}>
                  Back
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleJoin}
                  disabled={!displayName.trim() || roomCode.length < 4 || !socket.state.connected}
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
