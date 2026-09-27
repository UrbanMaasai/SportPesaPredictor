import { Match } from './types';

interface H2HDisplayProps {
  match: Match;
}

// Parse H2H string like "3-1-2" into { homeWins, draws, awayWins }
function parseH2H(h2h: string): { homeWins: number; draws: number; awayWins: number } {
  const parts = h2h.split('-').map(Number);
  return {
    homeWins: parts[0] || 0,
    draws: parts[1] || 0,
    awayWins: parts[2] || 0,
  };
}

export default function H2HDisplay({ match }: H2HDisplayProps) {
  const { homeWins, draws, awayWins } = parseH2H(match.h2h);
  const total = homeWins + draws + awayWins || 1;
  const homePct = (homeWins / total) * 100;
  const drawPct = (draws / total) * 100;
  const awayPct = (awayWins / total) * 100;

  // Goal margin simulation based on H2H
  const avgHomeGoals = (homeWins * 1.8 + draws * 1.2 + awayWins * 0.8) / total;
  const avgAwayGoals = (homeWins * 0.8 + draws * 1.2 + awayWins * 1.8) / total;
  const goalMargin = avgHomeGoals - avgAwayGoals;

  return (
    <div className="rounded-lg bg-slate-800/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-500 uppercase">Head-to-Head</span>
        <span className="tabular-nums text-[10px] text-slate-600">{match.h2h} last {total}</span>
      </div>

      {/* H2H Bar */}
      <div className="mb-2 flex h-3 overflow-hidden rounded-full">
        <div
          className="bg-emerald-500 transition-all"
          style={{ width: `${homePct}%` }}
          title={`${match.homeTeam}: ${homeWins} wins`}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${drawPct}%` }}
          title={`Draws: ${draws}`}
        />
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${awayPct}%` }}
          title={`${match.awayTeam}: ${awayWins} wins`}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-emerald-400">{match.homeTeam} · {homeWins}W</span>
        <span className="text-amber-400">{draws}D</span>
        <span className="text-blue-400">{awayWins}W · {match.awayTeam}</span>
      </div>

      {/* Goal Margin */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-[10px] text-slate-500">Avg Goal Margin:</span>
        <span className={`tabular-nums text-xs font-medium ${goalMargin > 0 ? 'text-emerald-400' : goalMargin < 0 ? 'text-blue-400' : 'text-amber-400'}`}>
          {goalMargin > 0 ? '+' : ''}{goalMargin.toFixed(1)}
        </span>
      </div>

      {/* Mini Goal Distribution */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="tabular-nums text-sm font-bold text-emerald-400">{avgHomeGoals.toFixed(1)}</div>
          <div className="text-[9px] text-slate-600">Home xG</div>
        </div>
        <div className="text-center">
          <div className="text-slate-600 text-xs">vs</div>
        </div>
        <div className="text-center">
          <div className="tabular-nums text-sm font-bold text-blue-400">{avgAwayGoals.toFixed(1)}</div>
          <div className="text-[9px] text-slate-600">Away xG</div>
        </div>
      </div>
    </div>
  );
}
