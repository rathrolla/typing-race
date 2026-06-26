import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useSoloGame, HUMAN_ID } from './hooks/useSoloGame';
import { LandingScreen } from './screens/LandingScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { RaceScreen } from './screens/RaceScreen';
import { PodiumScreen } from './screens/PodiumScreen';
import { RoundInterstitial } from './screens/RoundInterstitial';
import { SoloSetupScreen } from './screens/SoloSetupScreen';
import { SoloLoadingScreen } from './screens/SoloLoadingScreen';
import { getTotalRounds } from '@typing-race/shared';
import type { SoloConfig } from './hooks/useSoloGame';

type AppMode = 'multiplayer' | 'solo';
type MultiScreen = 'landing' | 'lobby' | 'race' | 'interstitial' | 'podium';
type SoloScreen = 'setup' | 'loading' | 'race' | 'interstitial' | 'podium';

function getMultiScreen(
  room: ReturnType<typeof useSocket>['state']['room'],
  gameOver: ReturnType<typeof useSocket>['state']['gameOver'],
  lastRoundResult: ReturnType<typeof useSocket>['state']['lastRoundResult'],
  roundWord: string | null
): MultiScreen {
  if (!room) return 'landing';
  if (gameOver || room.status === 'finished') return 'podium';
  if (lastRoundResult && !roundWord) return 'interstitial';
  if (room.status === 'playing' && roundWord) return 'race';
  return 'lobby';
}

function getSoloScreen(solo: ReturnType<typeof useSoloGame>['state']): SoloScreen {
  if (solo.status === 'idle') return 'setup';
  if (solo.status === 'loading') return 'loading';
  if (solo.status === 'finished') return 'podium';
  if (solo.status === 'interstitial') return 'interstitial';
  return 'race';
}

export default function App() {
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const socket = useSocket();
  const solo = useSoloGame();
  const { state, clearError } = socket;

  const multiScreen = getMultiScreen(state.room, state.gameOver, state.lastRoundResult, state.roundWord);
  const soloScreen = getSoloScreen(solo.state);

  const showConnecting = appMode === 'multiplayer' && !state.connected && !state.room;

  useEffect(() => {
    if (state.room && appMode === null) {
      setAppMode('multiplayer');
    }
  }, [state.room, appMode]);

  const handleSoloStart = (config: SoloConfig) => {
    void solo.startGame(config);
  };

  const goHome = () => {
    socket.leaveRoom();
    solo.reset();
    setAppMode(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(167,139,250,0.06),_transparent_50%)]" />

      {showConnecting && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500/90 text-arcade-bg text-center py-2 text-sm font-medium">
          Connecting to server...
        </div>
      )}

      <AnimatePresence>
        {state.error && appMode === 'multiplayer' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 panel px-4 py-3 border-red-500/50 bg-red-950/80 flex items-center gap-3"
          >
            <span className="text-red-300 text-sm">{state.error}</span>
            <button onClick={clearError} className="text-red-200 hover:text-white text-lg leading-none">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {appMode === null && (
          <LandingScreen
            key="landing"
            socket={socket}
            onPlaySolo={() => setAppMode('solo')}
          />
        )}

        {appMode === 'multiplayer' && multiScreen === 'lobby' && state.room && (
          <LobbyScreen key="lobby" socket={socket} room={state.room} />
        )}

        {appMode === 'multiplayer' && multiScreen === 'race' && state.room && state.roundWord && (
          <RaceScreen
            key="multi-race"
            word={state.roundWord}
            remainingMs={state.remainingMs}
            roundIndex={state.room.currentRound?.roundIndex ?? 0}
            wordLength={state.room.currentRound?.wordLength ?? state.roundWord.length}
            roundStartedAt={state.roundStartedAt || state.room.currentRound?.startedAt || Date.now()}
            timeoutMs={state.timeoutMs || state.room.currentRound?.timeoutMs || 0}
            racers={state.room.players}
            liveProgress={state.room.liveProgress}
            playerId={state.room.playerId ?? ''}
            onProgress={socket.sendProgress}
            onSubmit={socket.submitWord}
            totalRounds={getTotalRounds(state.room.typingMode)}
            typingMode={state.room.typingMode}
          />
        )}

        {appMode === 'multiplayer' && multiScreen === 'interstitial' && state.lastRoundResult && (
          <RoundInterstitial key="multi-interstitial" result={state.lastRoundResult} />
        )}

        {appMode === 'multiplayer' && multiScreen === 'podium' && state.room && (
          <PodiumScreen
            key="multi-podium"
            standings={state.gameOver?.standings ?? state.room.finalStandings ?? []}
            onPlayAgain={() => socket.playAgain()}
            onLeave={goHome}
          />
        )}

        {appMode === 'solo' && soloScreen === 'setup' && (
          <SoloSetupScreen
            key="solo-setup"
            onStart={handleSoloStart}
            onBack={goHome}
          />
        )}

        {appMode === 'solo' && soloScreen === 'loading' && (
          <SoloLoadingScreen key="solo-loading" />
        )}

        {appMode === 'solo' && soloScreen === 'race' && solo.state.word && (
          <RaceScreen
            key="solo-race"
            word={solo.state.word}
            remainingMs={solo.state.remainingMs}
            roundIndex={solo.state.roundIndex}
            wordLength={solo.state.wordLength}
            roundStartedAt={solo.state.roundStartedAt}
            timeoutMs={solo.state.timeoutMs}
            racers={solo.state.racers}
            liveProgress={solo.state.liveProgress}
            playerId={HUMAN_ID}
            onProgress={solo.updateProgress}
            onSubmit={solo.submitWord}
            totalRounds={solo.state.config ? getTotalRounds(solo.state.config.typingMode) : 10}
            typingMode={solo.state.config?.typingMode ?? 'mixed'}
          />
        )}

        {appMode === 'solo' && soloScreen === 'interstitial' && solo.state.lastRoundResult && (
          <RoundInterstitial key="solo-interstitial" result={solo.state.lastRoundResult} />
        )}

        {appMode === 'solo' && soloScreen === 'podium' && solo.state.gameOver && (
          <PodiumScreen
            key="solo-podium"
            standings={solo.state.gameOver.standings}
            title={solo.state.config?.mode === 'practice' ? 'Practice Complete!' : 'Race Complete!'}
            onPlayAgain={() => {
              const config = solo.state.config;
              if (config) void solo.startGame(config);
            }}
            onLeave={goHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
