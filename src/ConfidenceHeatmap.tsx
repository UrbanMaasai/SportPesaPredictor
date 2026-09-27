import { Match, Selection } from './types';

interface ConfidenceHeatmapProps {
  matches: Match[];
  selections: Selection[][];
  strategies: { id: string; name: string; picks: Selection[]; color: string }[];
}

export default function ConfidenceHeatmap({ matches, selections, strategies }: ConfidenceHeatmapProps) {
  // Calculate confidence for each match based on strategy agreement
  const matchConfidence = matches.map((match, i) => {
    const picks = strategies.map(s => s.picks[i]);
    const unique = [...new Set(picks)];
    const agreement = unique.length === 1 ? 100 : unique.length === 2 ? 66 : 33;
    const baseConfidence = match.confidence || 50;
    return Math.round((agreement + baseConfidence) / 2);
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200">Prediction Confidence Heatmap</h3>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-500">Low</span>
          <div className="flex h-3 w-24 overflow-hidden rounded">
            <div className="flex-1 bg-rose-500" />
            <div className="flex-1 bg-amber-500" />
            <div className="flex-1 bg-emerald-500" />
          </div>
          <span className="text-slate-500">High</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 gap-1.5 md:grid-cols-9">
        {matches.map((match, i) => {
          const confidence = matchConfidence[i];
          const sel = selections[i];
          const bgColor = confidence >= 75 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-rose-500';
          const opacity = 0.3 + (confidence / 100) * 0.7;

          return (
            <div
              key={match.id}
              className="group relative flex flex-col items-center justify-center rounded-lg p-2 transition-all hover:scale-105"
              style={{ backgroundColor: `rgba(${confidence >= 75 ? '16, 185, 129' : confidence >= 50 ? '245, 158, 11' : '244, 63, 94'}, ${opacity})` }}
            >
              <span className="tabular-nums text-xs font-bold text-white">{match.id}</span>
              <span className="mt-0.5 text-[9px] text-white/80 truncate max-w-full">
                {match.homeTeam.split(' ')[0]}
              </span>
              <span className="text-[9px] text-white/80 truncate max-w-full">
                {match.awayTeam.split(' ')[0]}
              </span>
              <div className="mt-1 flex gap-0.5">
                {sel.map(s => (
                  <span key={s} className="rounded bg-white/20 px-1 text-[8px] font-bold text-white">
                    {s}
                  </span>
                ))}
              </div>
              <span className="tabular-nums mt-1 text-[10px] font-bold text-white">{confidence}%</span>

              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-950 p-2 text-[10px] text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                <div className="whitespace-nowrap">
                  <div className="font-bold text-slate-100">{match.homeTeam} vs {match.awayTeam}</div>
                  <div className="mt-1">Confidence: <span className="tabular-nums text-emerald-400">{confidence}%</span></div>
                  <div>Odds: <span className="tabular-nums">{match.odds['1'].toFixed(2)} / {match.odds['X'].toFixed(2)} / {match.odds['2'].toFixed(2)}</span></div>
                  <div>Selection: <span className="font-bold">{sel.join('/')}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <div className="text-[10px] text-emerald-400">High Confidence</div>
          <div className="tabular-nums text-lg font-bold text-emerald-400">
            {matchConfidence.filter(c => c >= 75).length}
          </div>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-2 text-center">
          <div className="text-[10px] text-amber-400">Medium</div>
          <div className="tabular-nums text-lg font-bold text-amber-400">
            {matchConfidence.filter(c => c >= 50 && c < 75).length}
          </div>
        </div>
        <div className="rounded-lg bg-rose-500/10 p-2 text-center">
          <div className="text-[10px] text-rose-400">Low Confidence</div>
          <div className="tabular-nums text-lg font-bold text-rose-400">
            {matchConfidence.filter(c => c < 50).length}
          </div>
        </div>
      </div>
    </div>
  );
}
