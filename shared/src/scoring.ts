import type { PlayerProgress, RoundPlayerResult } from './types.js';

export function calculateWpm(wordLength: number, timeMs: number): number {
  if (timeMs <= 0) return 0;
  const minutes = timeMs / 60000;
  const words = wordLength / 5;
  return Math.round((words / minutes) * 10) / 10;
}

export function rankRoundResults(
  players: { id: string; name: string; color: string }[],
  progress: Map<string, PlayerProgress>,
  wordLength: number,
  roundStartedAt: number,
  endsAt: number
): RoundPlayerResult[] {
  const results: RoundPlayerResult[] = players.map((player) => {
    const p = progress.get(player.id);
    const finished = p?.finished ?? false;
    const finishTimeMs = finished && p?.finishTimeMs != null
      ? p.finishTimeMs - roundStartedAt
      : null;
    const wpm = finished && finishTimeMs != null
      ? calculateWpm(wordLength, finishTimeMs)
      : null;

    return {
      playerId: player.id,
      name: player.name,
      color: player.color,
      finished,
      finishTimeMs,
      wpm,
      rank: 0,
    };
  });

  results.sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.finished && b.finished) {
      if ((a.finishTimeMs ?? Infinity) !== (b.finishTimeMs ?? Infinity)) {
        return (a.finishTimeMs ?? Infinity) - (b.finishTimeMs ?? Infinity);
      }
      return (b.wpm ?? 0) - (a.wpm ?? 0);
    }
    return 0;
  });

  let rank = 1;
  for (let i = 0; i < results.length; i++) {
    if (i > 0) {
      const prev = results[i - 1];
      const curr = results[i];
      const tied =
        prev.finished === curr.finished &&
        prev.finishTimeMs === curr.finishTimeMs &&
        prev.wpm === curr.wpm;
      if (!tied) rank = i + 1;
    }
    results[i].rank = results[i].finished ? rank : results.length;
  }

  return results;
}

export function computeStandings(
  players: { id: string; name: string; color: string }[],
  roundResults: { rankings: RoundPlayerResult[] }[]
) {
  const stats = new Map(
    players.map((p) => [
      p.id,
      {
        playerId: p.id,
        name: p.name,
        color: p.color,
        roundWins: 0,
        wpmSum: 0,
        wpmCount: 0,
        fastestWordMs: null as number | null,
        totalFinished: 0,
      },
    ])
  );

  for (const round of roundResults) {
    const winner = round.rankings.find((r) => r.rank === 1 && r.finished);
    if (winner) {
      const s = stats.get(winner.playerId);
      if (s) s.roundWins += 1;
    }

    for (const r of round.rankings) {
      const s = stats.get(r.playerId);
      if (!s || !r.finished || r.wpm == null) continue;
      s.wpmSum += r.wpm;
      s.wpmCount += 1;
      s.totalFinished += 1;
      if (r.finishTimeMs != null) {
        s.fastestWordMs =
          s.fastestWordMs == null
            ? r.finishTimeMs
            : Math.min(s.fastestWordMs, r.finishTimeMs);
      }
    }
  }

  const standings = [...stats.values()].map((s) => ({
    playerId: s.playerId,
    name: s.name,
    color: s.color,
    roundWins: s.roundWins,
    avgWpm: s.wpmCount > 0 ? Math.round((s.wpmSum / s.wpmCount) * 10) / 10 : 0,
    fastestWordMs: s.fastestWordMs,
    totalFinished: s.totalFinished,
  }));

  standings.sort((a, b) => {
    if (b.roundWins !== a.roundWins) return b.roundWins - a.roundWins;
    if (b.avgWpm !== a.avgWpm) return b.avgWpm - a.avgWpm;
    if (a.fastestWordMs == null && b.fastestWordMs == null) return 0;
    if (a.fastestWordMs == null) return 1;
    if (b.fastestWordMs == null) return -1;
    return a.fastestWordMs - b.fastestWordMs;
  });

  return standings;
}
