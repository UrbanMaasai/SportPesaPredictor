import { useMemo } from 'react';
import { Match } from './types';

interface OddsTimelineProps {
  matches: Match[];
  selectedMatchId: number | null;
}

// Generate mock historical odds data
function generateOddsHistory(baseOdds: number, daysAgo: number): number[] {
  const points: number[] = [];
  let current = baseOdds * (1 + (Math.random() - 0.5) * 0.15);
  for (let i = 0; i < daysAgo; i++) {
    const drift = (Math.random() - 0.48) * 0.08;
    current = Math.max(1.01, current * (1 + drift));
    points.push(current);
  }
  points.push(baseOdds); // Current
  return points;
}

export default function OddsTimeline({ matches, selectedMatchId }: OddsTimelineProps) {
  const match = matches.find(m => m.id === selectedMatchId) || matches[0];

  const history = useMemo(() => ({
    '1': generateOddsHistory(match.odds['1'], 14),
    'X': generateOddsHistory(match.odds['X'], 14),
    '2': generateOddsHistory(match.odds['2'], 14),
  }), [match]);

  const allValues = [...history['1'], ...history['X'], ...history['2']];
  const minVal = Math.min(...allValues) * 0.95;
  const maxVal = Math.max(...allValues) * 1.05;
  const range = maxVal - minVal;

  const width = 500;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 25, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const toPoint = (values: number[], idx: number): { x: number; y: number } => ({
    x: padding.left + (idx / (values.length - 1)) * chartW,
    y: padding.top + chartH - ((values[idx] - minVal) / range) * chartH,
  });

  const toPath = (values: number[]): string =>
    values.map((_, i) => {
      const p = toPoint(values, i);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ');

  const colors = { '1': '#10b981', 'X': '#f59e0b', '2': '#3b82f6' };
  const labels = { '1': 'Home', 'X': 'Draw', '2': 'Away' };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Odds Drift Timeline</h3>
          <p className="text-[10px] text-slate-500">{match.homeTeam} vs {match.awayTeam} · 14-day history</p>
        </div>
        <div className="flex gap-3">
          {(['1', 'X', '2'] as const).map(key => (
            <div key={key} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[key] }} />
              <span className="text-[10px] text-slate-500">{labels[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padding.top + chartH * (1 - frac);
          const val = minVal + range * frac;
          return (
            <g key={frac}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeWidth="0.5" />
              <text x={padding.left - 5} y={y + 3} textAnchor="end" className="fill-slate-600" fontSize="8" fontFamily="JetBrains Mono">{val.toFixed(2)}</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 3, 7, 10, 14].map(day => {
          const x = padding.left + (day / 14) * chartW;
          return (
            <text key={day} x={x} y={height - 5} textAnchor="middle" className="fill-slate-600" fontSize="8" fontFamily="JetBrains Mono">
              {day === 0 ? 'Now' : `-${14 - day}d`}
            </text>
          );
        })}

        {/* Lines */}
        {(['1', 'X', '2'] as const).map(key => (
          <g key={key}>
            <path d={toPath(history[key])} fill="none" stroke={colors[key]} strokeWidth="1.5" strokeLinecap="round" />
            {/* Current point */}
            <circle
              cx={toPoint(history[key], history[key].length - 1).x}
              cy={toPoint(history[key], history[key].length - 1).y}
              r="3"
              fill={colors[key]}
            />
            {/* Current value label */}
            <text
              x={toPoint(history[key], history[key].length - 1).x + 6}
              y={toPoint(history[key], history[key].length - 1).y + 3}
              className="fill-slate-400"
              fontSize="8"
              fontFamily="JetBrains Mono"
            >
              {history[key][history[key].length - 1].toFixed(2)}
            </text>
          </g>
        ))}
      </svg>

      {/* Movement Summary */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(['1', 'X', '2'] as const).map(key => {
          const start = history[key][0];
          const end = history[key][history[key].length - 1];
          const change = ((end - start) / start * 100).toFixed(1);
          const isUp = end > start;
          return (
            <div key={key} className="rounded-lg bg-slate-800/60 px-2 py-1.5 text-center">
              <div className="text-[10px] text-slate-500">{labels[key]}</div>
              <div className="tabular-nums text-xs font-medium" style={{ color: colors[key] }}>
                {end.toFixed(2)}
              </div>
              <div className={`tabular-nums text-[10px] ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isUp ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
