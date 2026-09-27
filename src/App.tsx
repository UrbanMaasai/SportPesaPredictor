import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from 'react';
import { Match, Selection, ViewMode } from './types';
import {
  megaJackpot, midweekJackpot, generateStrategies,
  calculatePermutations, formatSMS, getCountdown, getFormColor,
  optimizeBudget
} from './data';
import {
  Trophy, Zap, Target, Wallet, Ticket, Play, Copy, Check,
  Download, Share2, ChevronDown, Filter, TrendingUp,
  AlertTriangle, Shield, Flame, BarChart3, Clock, X,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Layers,
  Upload, Printer, History, Save
} from 'lucide-react';
import ParserModal from './ParserModal';
import PrintableSlip from './PrintableSlip';
import OddsTimeline from './OddsTimeline';
import H2HDisplay from './H2HDisplay';
import { usePersistence } from './usePersistence';

// ============ SPARKLINE CHART ============
function Sparkline({ data, color = '#10b981', height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
}

// ============ RADAR CHART ============
function RadarChart({ values, labels, size = 140 }: { values: number[]; labels: string[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;
  const n = values.length;
  const angleStep = (2 * Math.PI) / n;

  const points = values.map((v, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = (v / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size}>
      {gridLevels.map(level => {
        const gridPoints = Array.from({ length: n }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const dist = level * r;
          return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={level} points={gridPoints} fill="none" stroke="#334155" strokeWidth="0.5" />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#334155" strokeWidth="0.5" />;
      })}
      <path d={pathD} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#10b981" />
          <text x={cx + (r + 12) * Math.cos(i * angleStep - Math.PI / 2)} y={cy + (r + 12) * Math.sin(i * angleStep - Math.PI / 2)} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" fontSize="8">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

// ============ ODDS DRIFT CHART ============
function OddsDriftChart({ initialOdds, currentOdds }: { initialOdds: number; currentOdds: number }) {
  const diff = currentOdds - initialOdds;
  const pctChange = ((diff / initialOdds) * 100).toFixed(1);
  const isUp = diff > 0;
  const isDown = diff < 0;

  return (
    <div className="flex items-center gap-1.5">
      {isUp && <ArrowUpRight size={12} className="text-rose-400" />}
      {isDown && <ArrowDownRight size={12} className="text-emerald-400" />}
      {!isUp && !isDown && <Minus size={12} className="text-slate-500" />}
      <span className={`tabular-nums text-[10px] font-medium ${isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-500'}`}>
        {isUp ? '+' : ''}{pctChange}%
      </span>
    </div>
  );
}

// ============ TOP BAR ============
function TopBar({ view, setView, jackpotType, setJackpotType }: {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  jackpotType: 'mega' | 'midweek';
  setJackpotType: (t: 'mega' | 'midweek') => void;
}) {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'matches', label: 'Fixtures', icon: <Target size={15} /> },
    { id: 'strategies', label: 'Strategies', icon: <Zap size={15} /> },
    { id: 'permutations', label: 'Permutations', icon: <BarChart3 size={15} /> },
    { id: 'budget', label: 'Budget', icon: <Wallet size={15} /> },
    { id: 'slip', label: 'Slip', icon: <Ticket size={15} /> },
    { id: 'simulator', label: 'Simulator', icon: <Play size={15} /> },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-100">JackpotIQ</span>
          </div>
          <span className="hidden text-sm text-slate-500 sm:inline">·</span>
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => setJackpotType('mega')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${jackpotType === 'mega' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              MJP 17
            </button>
            <button
              onClick={() => setJackpotType('midweek')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${jackpotType === 'midweek' ? 'bg-blue-500/15 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              MW 13
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-0.5 rounded-lg bg-slate-900 p-0.5">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === v.id ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {v.icon}
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="tabular-nums text-xs text-slate-500">
            {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </header>
  );
}

// ============ MATCH GRID ============
function MatchGrid({ matches, selections, onSelectionChange, showSlumpOnly, onToggleSlump }: {
  matches: Match[];
  selections: Selection[][];
  onSelectionChange: (matchIndex: number, selection: Selection[]) => void;
  showSlumpOnly: boolean;
  onToggleSlump: () => void;
}) {
  const filteredMatches = showSlumpOnly ? matches.filter(m => m.isSlump) : matches;
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  // Generate mock odds drift data
  const oddsDrift = useMemo(() => matches.map(m => ({
    '1': m.odds['1'] * (0.95 + Math.random() * 0.1),
    'X': m.odds['X'] * (0.95 + Math.random() * 0.1),
    '2': m.odds['2'] * (0.95 + Math.random() * 0.1),
  })), [matches]);

  return (
    <div className="animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Fixture Analysis</h2>
          <p className="text-xs text-slate-500">
            {matches.length} matches · {showSlumpOnly ? `${filteredMatches.length} slump warnings` : 'All fixtures'}
          </p>
        </div>
        <button
          onClick={onToggleSlump}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showSlumpOnly ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          <AlertTriangle size={13} />
          Filter Slump
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-medium text-slate-500">
              <th className="px-3 py-3 text-left">#</th>
              <th className="px-3 py-3 text-left">Match</th>
              <th className="px-3 py-3 text-left">League</th>
              <th className="px-3 py-3 text-center">Kickoff</th>
              <th className="px-3 py-3 text-center">
                <button onClick={onToggleSlump} className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                  <Filter size={11} /> Form
                </button>
              </th>
              <th className="px-3 py-3 text-center tabular-nums">1</th>
              <th className="px-3 py-3 text-center tabular-nums">X</th>
              <th className="px-3 py-3 text-center tabular-nums">2</th>
              <th className="px-3 py-3 text-center">Drift</th>
              <th className="px-3 py-3 text-center">Pick</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map((match) => {
              const realIdx = matches.indexOf(match);
              const sel = selections[realIdx] || ['1'];
              const drift = oddsDrift[realIdx];
              const favOddsKey = sel[0] as '1' | 'X' | '2';
              return (
                <Fragment key={match.id}>
                <tr className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 cursor-pointer ${match.isSlump ? 'bg-rose-500/5' : ''}`} onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}>
                  <td className="px-3 py-2.5">
                    <span className="tabular-nums text-xs font-medium text-slate-500">{match.id}</span>
                    {match.isSlump && <AlertTriangle size={10} className="ml-1 inline text-rose-400" />}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200">{match.homeTeam}</span>
                      <span className="text-xs text-slate-500">vs {match.awayTeam}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">{match.league}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="tabular-nums text-xs text-slate-300">{getCountdown(match.kickoff)}</span>
                      <span className="text-[10px] text-slate-600">{match.kickoff.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-0.5">
                        {match.form.home.split('').map((r, i) => (
                          <span key={i} className={`h-3.5 w-3.5 rounded-sm ${getFormColor(r)} flex items-center justify-center text-[8px] font-bold text-white`}>{r}</span>
                        ))}
                      </div>
                      <div className="flex gap-0.5">
                        {match.form.away.split('').map((r, i) => (
                          <span key={i} className={`h-3.5 w-3.5 rounded-sm ${getFormColor(r)} flex items-center justify-center text-[8px] font-bold text-white`}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`tabular-nums text-sm font-medium ${sel.includes('1') ? 'text-emerald-400' : 'text-slate-400'}`}>{match.odds['1'].toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`tabular-nums text-sm font-medium ${sel.includes('X') ? 'text-amber-400' : 'text-slate-400'}`}>{match.odds['X'].toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`tabular-nums text-sm font-medium ${sel.includes('2') ? 'text-blue-400' : 'text-slate-400'}`}>{match.odds['2'].toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <OddsDriftChart initialOdds={match.odds[favOddsKey]} currentOdds={drift[favOddsKey]} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {(['1', 'X', '2'] as Selection[]).map(outcome => (
                        <button
                          key={outcome}
                          onClick={() => {
                            const newSel = sel.includes(outcome)
                              ? sel.filter(s => s !== outcome)
                              : [...sel.filter(s => s !== '1' && s !== 'X' && s !== '2'), outcome];
                            if (newSel.length === 0) newSel.push(outcome);
                            onSelectionChange(realIdx, newSel);
                          }}
                          className={`h-7 w-7 rounded-md text-xs font-bold transition-all ${sel.includes(outcome)
                            ? outcome === '1' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                              : outcome === 'X' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                              : 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                        >
                          {outcome}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
                {/* Expanded H2H Detail Row */}
                {expandedMatch === match.id && (
                  <tr className="border-b border-slate-800/50">
                    <td colSpan={10} className="px-4 py-3 bg-slate-900/80">
                      <div className="grid gap-4 md:grid-cols-2">
                        <H2HDisplay match={match} />
                        <div className="rounded-lg bg-slate-800/40 p-3">
                          <div className="mb-2 text-[10px] font-medium text-slate-500 uppercase">Match Insight</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Confidence</span>
                              <span className="tabular-nums font-medium text-emerald-400">{match.confidence || 50}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${match.confidence || 50}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Implied Probability (1)</span>
                              <span className="tabular-nums text-slate-300">{(100 / match.odds['1']).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Implied Probability (X)</span>
                              <span className="tabular-nums text-slate-300">{(100 / match.odds['X']).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Implied Probability (2)</span>
                              <span className="tabular-nums text-slate-300">{(100 / match.odds['2']).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Overround</span>
                              <span className="tabular-nums text-amber-400">{((100 / match.odds['1'] + 100 / match.odds['X'] + 100 / match.odds['2']) - 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ STRATEGIES VIEW ============
function StrategiesView({ matches, activeStrategy, setActiveStrategy }: {
  matches: Match[];
  activeStrategy: string;
  setActiveStrategy: (s: string) => void;
}) {
  const strategies = useMemo(() => generateStrategies(matches), [matches]);

  const radarData = useMemo(() => {
    const avgConfidence = matches.reduce((sum, m) => sum + (m.confidence || 50), 0) / matches.length;
    const drawMatches = matches.filter(m => m.odds['X'] < 3.3).length;
    const upsetPotential = matches.filter(m => Math.max(m.odds['1'], m.odds['2']) > 4).length;
    const formClarity = matches.filter(m => m.form.home.startsWith('W') || m.form.away.startsWith('W')).length;
    return [avgConfidence, (drawMatches / matches.length) * 100, (upsetPotential / matches.length) * 100, (formClarity / matches.length) * 100, 65, 72];
  }, [matches]);

  // Mock predictability trend data
  const trendData = useMemo(() => Array.from({ length: 12 }, (_, i) => 40 + Math.sin(i * 0.8) * 20 + Math.random() * 10), []);

  return (
    <div className="animate-slide-up">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">Strategy Engine</h2>
        <p className="text-xs text-slate-500">Multi-model consensus · Agreement scoring · Tactical analysis</p>
      </div>

      {/* Tactical Radar + Trend */}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-xs font-medium text-slate-400">Tactical Radar</h3>
          <div className="flex justify-center">
            <RadarChart values={radarData} labels={['Conf', 'Draws', 'Upsets', 'Form', 'H2H', 'Value']} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-xs font-medium text-slate-400">Predictability Trend (12 weeks)</h3>
          <div className="flex items-end justify-center pt-4">
            <Sparkline data={trendData} color="#3b82f6" height={80} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
            <span>Week 1</span>
            <span className="tabular-nums text-blue-400">Current: {trendData[trendData.length - 1].toFixed(0)}%</span>
            <span>Week 12</span>
          </div>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {strategies.map(strategy => {
          const correctCount = strategy.picks.filter((p, i) => {
            const match = matches[i];
            if (!match) return false;
            const lowest = Object.entries(match.odds).sort((a, b) => a[1] - b[1])[0][0];
            return p === lowest;
          }).length;
          return (
            <button
              key={strategy.id}
              onClick={() => setActiveStrategy(strategy.id)}
              className={`rounded-xl border p-4 text-left transition-all ${activeStrategy === strategy.id
                ? 'border-slate-600 bg-slate-800/80 shadow-lg'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: strategy.color }} />
                <span className="text-sm font-bold text-slate-200">{strategy.name}</span>
                {activeStrategy === strategy.id && <Check size={14} className="ml-auto text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-500">{strategy.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {strategy.picks.slice(0, 10).map((pick, i) => (
                  <span key={i} className={`tabular-nums rounded px-1.5 py-0.5 text-[10px] font-bold ${pick === '1' ? 'bg-emerald-500/15 text-emerald-400' : pick === 'X' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {pick}
                  </span>
                ))}
                {strategy.picks.length > 10 && <span className="text-[10px] text-slate-600">+{strategy.picks.length - 10}</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-600">Avg confidence:</span>
                <span className="tabular-nums text-[10px] font-medium" style={{ color: strategy.color }}>
                  {matches.reduce((s, m) => s + (m.confidence || 50), 0) / matches.length}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Consensus Matrix */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Consensus Matrix</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-medium text-slate-500">
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Match</th>
                {strategies.map(s => (
                  <th key={s.id} className="px-2 py-2 text-center" style={{ color: s.color }}>{s.name.slice(0, 5)}</th>
                ))}
                <th className="px-2 py-2 text-center">Agree</th>
                <th className="px-2 py-2 text-center">Pick</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, i) => {
                const picks = strategies.map(s => s.picks[i]);
                const unique = [...new Set(picks)];
                const agreement = unique.length === 1 ? 100 : unique.length === 2 ? 66 : 33;
                const consensusPick = picks.sort((a, b) => picks.filter(v => v === b).length - picks.filter(v => v === a).length)[0];
                return (
                  <tr key={match.id} className="border-t border-slate-800/50">
                    <td className="px-2 py-1.5 tabular-nums text-xs text-slate-500">{match.id}</td>
                    <td className="px-2 py-1.5 text-xs text-slate-300">{match.homeTeam} v {match.awayTeam}</td>
                    {picks.map((pick, j) => (
                      <td key={j} className="px-2 py-1.5 text-center">
                        <span className={`tabular-nums rounded px-1.5 py-0.5 text-[10px] font-bold ${pick === '1' ? 'bg-emerald-500/15 text-emerald-400' : pick === 'X' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                          {pick}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      <span className={`tabular-nums text-xs font-medium ${agreement === 100 ? 'text-emerald-400' : agreement >= 66 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {agreement}%
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${consensusPick === '1' ? 'bg-emerald-500/20 text-emerald-400' : consensusPick === 'X' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {consensusPick}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hedging & Coverage */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
          <Layers size={14} className="text-violet-400" />
          Hedging & Coverage Slips
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { name: 'Banker Ticket', desc: 'All heavy favorites (odds < 1.80)', color: 'emerald', picks: matches.map(m => { const lowest = Object.entries(m.odds).sort((a, b) => a[1] - b[1])[0]; return lowest[1] < 1.8 ? lowest[0] : Object.entries(m.odds).sort((a, b) => a[1] - b[1])[0][0]; }) },
            { name: 'Draw Hedge', desc: 'Draw-prone matches as doubles', color: 'amber', picks: matches.map(m => m.odds['X'] < 3.3 ? ['X', Object.entries(m.odds).sort((a, b) => a[1] - b[1])[0][0]] : [Object.entries(m.odds).sort((a, b) => a[1] - b[1])[0][0]]) },
            { name: 'High Payout', desc: 'Target top-heavy bonus upsets', color: 'rose', picks: matches.map(m => { const highest = Object.entries(m.odds).sort((a, b) => b[1] - a[1])[0][0]; return highest; }) },
          ].map((ticket, ti) => (
            <div key={ti} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${ticket.color === 'emerald' ? 'bg-emerald-400' : ticket.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-xs font-bold text-slate-200">{ticket.name}</span>
              </div>
              <p className="mb-2 text-[10px] text-slate-500">{ticket.desc}</p>
              <div className="flex flex-wrap gap-0.5">
                {ticket.picks.map((p, i) => {
                  const pick = Array.isArray(p) ? p[0] : p;
                  return (
                    <span key={i} className={`rounded px-1 py-0.5 text-[9px] font-bold ${pick === '1' ? 'bg-emerald-500/15 text-emerald-400' : pick === 'X' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {Array.isArray(p) ? p.join('') : p}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ PERMUTATIONS VIEW ============
function PermutationsView({ matches, selections, onSelectionChange, stake }: {
  matches: Match[];
  selections: Selection[][];
  onSelectionChange: (idx: number, sel: Selection[]) => void;
  stake: number;
}) {
  const totalCombinations = useMemo(() => calculatePermutations(selections), [selections]);
  const totalPrice = totalCombinations * stake;
  const doubleCount = selections.filter(s => s.length === 2).length;
  const tripleCount = selections.filter(s => s.length === 3).length;
  const maxDoubles = matches.length === 17 ? 7 : 2;

  // Mock historical backtesting data
  const backtestData = useMemo(() => [
    { week: 'W1', hitRate: 62, payout: 'KES 0' },
    { week: 'W2', hitRate: 71, payout: 'KES 450' },
    { week: 'W3', hitRate: 58, payout: 'KES 0' },
    { week: 'W4', hitRate: 83, payout: 'KES 12,000' },
    { week: 'W5', hitRate: 76, payout: 'KES 2,500' },
    { week: 'W6', hitRate: 69, payout: 'KES 0' },
    { week: 'W7', hitRate: 91, payout: 'KES 152M' },
    { week: 'W8', hitRate: 64, payout: 'KES 0' },
  ], []);

  return (
    <div className="animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Permutation Engine</h2>
          <p className="text-xs text-slate-500">Double chance coverage · Total combinations calculator</p>
        </div>
        <div className="text-right">
          <div className="tabular-nums text-2xl font-bold text-emerald-400">{totalCombinations.toLocaleString()}</div>
          <div className="text-xs text-slate-500">combinations</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Total Lines</div>
          <div className="tabular-nums text-xl font-bold text-slate-200">{totalCombinations.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Total Cost</div>
          <div className="tabular-nums text-xl font-bold text-amber-400">KES {totalPrice.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Doubles</div>
          <div className="tabular-nums text-xl font-bold text-blue-400">{doubleCount}<span className="text-sm text-slate-600">/{maxDoubles}</span></div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Coverage</div>
          <div className="tabular-nums text-xl font-bold text-violet-400">{((totalCombinations / Math.pow(3, matches.length)) * 100).toFixed(4)}%</div>
        </div>
      </div>

      {/* Historical Backtesting */}
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
          <TrendingUp size={14} className="text-emerald-400" />
          Historical Backtesting (Last 8 Weeks)
        </h3>
        <div className="flex items-end gap-2 h-24">
          {backtestData.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center">
                <span className="tabular-nums text-[9px] text-slate-500">{d.hitRate}%</span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${d.hitRate * 0.8}px`,
                    backgroundColor: d.hitRate >= 80 ? '#10b981' : d.hitRate >= 65 ? '#3b82f6' : '#64748b',
                    opacity: 0.7
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-600">{d.week}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Avg hit rate: <span className="tabular-nums text-emerald-400">{(backtestData.reduce((s, d) => s + d.hitRate, 0) / backtestData.length).toFixed(0)}%</span></span>
          <span>Best payout: <span className="tabular-nums text-amber-400">KES 152,000,000</span></span>
        </div>
      </div>

      {/* Per-match breakdown */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Leg-by-Leg Coverage</h3>
        <div className="grid gap-2">
          {matches.map((match, i) => {
            const sel = selections[i];
            const legs = sel.length;
            return (
              <div key={match.id} className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-2">
                <span className="tabular-nums w-6 text-xs text-slate-500">{match.id}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{match.homeTeam} v {match.awayTeam}</span>
                <div className="flex items-center gap-1">
                  {sel.map(s => (
                    <span key={s} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s === '1' ? 'bg-emerald-500/15 text-emerald-400' : s === 'X' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <span className={`tabular-nums text-xs font-medium ${legs === 2 ? 'text-blue-400' : legs === 3 ? 'text-violet-400' : 'text-slate-500'}`}>
                  ×{legs}
                </span>
                {legs < 3 && (
                  <button
                    onClick={() => {
                      if (legs === 1) {
                        if (doubleCount >= maxDoubles) return;
                        const lowest = Object.entries(match.odds).sort((a, b) => a[1] - b[1]);
                        onSelectionChange(i, [lowest[0][0] as Selection, lowest[1][0] as Selection]);
                      } else {
                        onSelectionChange(i, ['1', 'X', '2']);
                      }
                    }}
                    disabled={legs === 1 && doubleCount >= maxDoubles}
                    className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-600 disabled:opacity-30"
                  >
                    +{legs === 1 ? 'Double' : 'Triple'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ BUDGET OPTIMIZER ============
function BudgetOptimizer({ matches, stake, onApply }: {
  matches: Match[];
  stake: number;
  onApply: (selections: Selection[][]) => void;
}) {
  const [budget, setBudget] = useState(9900);
  const maxDoubles = matches.length === 17 ? 7 : 2;
  const optimization = useMemo(() => optimizeBudget(matches, budget, stake, maxDoubles), [matches, budget, stake, maxDoubles]);

  const presets = [
    { label: 'KES 990', value: 990 },
    { label: 'KES 2,970', value: 2970 },
    { label: 'KES 9,900', value: 9900 },
    { label: 'KES 29,700', value: 29700 },
  ];

  return (
    <div className="animate-slide-up">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">Smart Budget Optimizer</h2>
        <p className="text-xs text-slate-500">Knapsack optimization · Maximize coverage within budget</p>
      </div>

      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <label className="mb-2 block text-xs font-medium text-slate-400">Total Budget (KES)</label>
        <input
          type="range"
          min={99}
          max={99000}
          step={99}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="tabular-nums text-2xl font-bold text-emerald-400">KES {budget.toLocaleString()}</span>
          <span className="text-xs text-slate-500">Stake: KES {stake}/line</span>
        </div>
        <div className="mt-3 flex gap-2">
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => setBudget(p.value)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${budget === p.value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Max Lines</div>
          <div className="tabular-nums text-xl font-bold text-slate-200">{optimization.totalCombinations}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Doubles Used</div>
          <div className="tabular-nums text-xl font-bold text-blue-400">{optimization.doubles.length}/{maxDoubles}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Actual Cost</div>
          <div className="tabular-nums text-xl font-bold text-amber-400">KES {optimization.totalCost.toLocaleString()}</div>
        </div>
      </div>

      {/* Budget Visualization */}
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-2 text-xs font-medium text-slate-400">Budget Allocation</h3>
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="flex h-full">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(matches.length - optimization.doubles.length) / matches.length * 100}%` }} />
            <div className="bg-blue-500 transition-all" style={{ width: `${optimization.doubles.length / matches.length * 100}%` }} />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-[10px]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Singles ({matches.length - optimization.doubles.length})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Doubles ({optimization.doubles.length})</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Optimized Selections</h3>
        <div className="space-y-1.5">
          {matches.map((match, i) => {
            const isDouble = optimization.doubles.includes(i);
            const sel = optimization.selections[i];
            return (
              <div key={match.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isDouble ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800/40'}`}>
                <span className="tabular-nums w-6 text-xs text-slate-500">{match.id}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{match.homeTeam} v {match.awayTeam}</span>
                {isDouble && <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">2X</span>}
                <div className="flex gap-1">
                  {sel.map(s => (
                    <span key={s} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s === '1' ? 'bg-emerald-500/15 text-emerald-400' : s === 'X' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onApply(optimization.selections)}
          className="mt-4 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
        >
          Apply Optimized Slip →
        </button>
      </div>
    </div>
  );
}

// ============ SLIP VIEW ============
function SlipView({ matches, selections, stake, jackpotType, onSave, onPrint }: {
  matches: Match[];
  selections: Selection[][];
  stake: number;
  jackpotType: 'mega' | 'midweek';
  onSave?: () => void;
  onPrint?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);
  const totalCombinations = calculatePermutations(selections);
  const totalPrice = totalCombinations * stake;
  const smsCode = formatSMS(selections, jackpotType);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(smsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [smsCode]);

  const handleExportJSON = useCallback(() => {
    const data = {
      type: jackpotType,
      matches: matches.map((m, i) => ({
        id: m.id, home: m.homeTeam, away: m.awayTeam,
        selection: selections[i]
      })),
      totalCombinations, totalPrice, smsCode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jackpotiq-${jackpotType}-slip.json`; a.click();
    URL.revokeObjectURL(url);
  }, [matches, selections, totalCombinations, totalPrice, smsCode, jackpotType]);

  const handleExportCSV = useCallback(() => {
    const rows = [['Match', 'Home', 'Away', 'Selection', 'Odds']];
    matches.forEach((m, i) => {
      rows.push([`${m.id}`, m.homeTeam, m.awayTeam, selections[i].join('/'),
        selections[i].map(s => m.odds[s as '1' | 'X' | '2']).join('/')]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jackpotiq-${jackpotType}-slip.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [matches, selections, jackpotType]);

  const telegramText = `🎯 *${jackpotType === 'mega' ? 'MEGA JACKPOT PRO' : 'MIDWEEK JACKPOT'}*
📅 ${new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
💰 Cost: KES ${totalPrice.toLocaleString()} (${totalCombinations} lines)

${matches.map((m, i) => `${i + 1}. ${m.homeTeam} vs ${m.awayTeam} → *${selections[i].join('/')}*`).join('\n')}

📲 SMS: \`${smsCode}\``;

  return (
    <div className="animate-slide-up">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">Bet Slip Output</h2>
        <p className="text-xs text-slate-500">SMS formatter · Export · Share</p>
      </div>

      {/* SMS Code Box */}
      <div className="mb-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400">SportPesa SMS 79079</span>
          <span className="text-[10px] text-slate-600">Send to 79079</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 font-mono text-lg font-bold tracking-wider text-emerald-400 tabular-nums scrollbar-thin">
            {smsCode}
          </code>
          <button
            onClick={handleCopy}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-600">
          {totalCombinations} line{totalCombinations > 1 ? 's' : ''} · KES {totalPrice.toLocaleString()} total stake
        </p>
      </div>

      {/* Visual Slip */}
      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-slate-200">
              {jackpotType === 'mega' ? 'Mega Jackpot Pro' : 'Midweek Jackpot'}
            </span>
          </div>
          <span className="tabular-nums text-xs text-slate-500">
            {new Date().toLocaleDateString('en-KE')}
          </span>
        </div>
        <div className="space-y-1">
          {matches.map((match, i) => (
            <div key={match.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs">
              <span className="tabular-nums w-5 text-slate-600">{match.id}</span>
              <span className="flex-1 truncate text-slate-300">{match.homeTeam} v {match.awayTeam}</span>
              <span className="text-[10px] text-slate-600">{match.league}</span>
              <div className="flex gap-1">
                {selections[i].map(s => (
                  <span key={s} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s === '1' ? 'bg-emerald-500/20 text-emerald-400' : s === 'X' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3">
          <span className="text-xs text-slate-500">{totalCombinations} lines · {selections.filter(s => s.length > 1).length} doubles</span>
          <span className="tabular-nums text-sm font-bold text-emerald-400">KES {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <button onClick={handleCopy} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
          <Copy size={14} /> Copy SMS
        </button>
        <button onClick={handleExportJSON} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
          <Download size={14} /> JSON
        </button>
        <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Save & Share Actions */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(telegramText);
            setCopiedTg(true);
            setTimeout(() => setCopiedTg(false), 2000);
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
        >
          {copiedTg ? <Check size={14} /> : <Share2 size={14} />} Telegram
        </button>
        {onSave && (
          <button onClick={onSave} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
            <Save size={14} /> Save Slip
          </button>
        )}
        {onPrint && (
          <button onClick={onPrint} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            <Printer size={14} /> Print / PDF
          </button>
        )}
      </div>

      {/* Telegram Share Preview */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Share2 size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-slate-300">Telegram Share Format</span>
        </div>
        <div className="rounded-lg bg-slate-950 p-3">
          <pre className="whitespace-pre-wrap text-[11px] text-slate-400 leading-relaxed">{telegramText}</pre>
        </div>
      </div>
    </div>
  );
}

// ============ SIMULATOR VIEW ============
function SimulatorView({ matches, selections }: {
  matches: Match[];
  selections: Selection[][];
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [minute, setMinute] = useState(0);
  const [scores, setScores] = useState<{ home: number; away: number }[]>(
    matches.map(() => ({ home: 0, away: 0 }))
  );
  const [results, setResults] = useState<('1' | 'X' | '2' | null)[]>(matches.map(() => null));
  const [goalEvents, setGoalEvents] = useState<{ matchIdx: number; team: 'home' | 'away'; minute: number }[]>([]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setMinute(prev => {
        const next = prev + 1;
        if (next >= 90) {
          setIsRunning(false);
          // Finalize results
          setScores(currentScores => {
            const finalResults = currentScores.map(s => {
              if (s.home > s.away) return '1' as const;
              if (s.home < s.away) return '2' as const;
              return 'X' as const;
            });
            setResults(finalResults);
            return currentScores;
          });
          return 90;
        }
        // Random goal events (~3% per minute per match)
        if (Math.random() < 0.04) {
          const matchIdx = Math.floor(Math.random() * matches.length);
          const team = Math.random() < 0.5 ? 'home' : 'away';
          setScores(prevScores => {
            const newScores = [...prevScores];
            newScores[matchIdx] = { ...newScores[matchIdx], [team]: newScores[matchIdx][team] + 1 };
            return newScores;
          });
          setGoalEvents(prev => [...prev, { matchIdx, team, minute: next }]);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isRunning, matches.length]);

  const correctPicks = results.filter((r, i) => r && selections[i].includes(r)).length;
  const totalResolved = results.filter(r => r !== null).length;
  const eliminated = results.some((r, i) => r !== null && !selections[i].includes(r));

  const reset = () => {
    setIsRunning(false);
    setMinute(0);
    setScores(matches.map(() => ({ home: 0, away: 0 })));
    setResults(matches.map(() => null));
    setGoalEvents([]);
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Live Matchday Simulator</h2>
          <p className="text-xs text-slate-500">90-min simulation · Track your ticket survival</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (minute >= 90) reset(); setIsRunning(!isRunning); }}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${isRunning ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}
          >
            {minute >= 90 ? '↻ Restart' : isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400 hover:bg-slate-700">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Clock */}
      <div className="mb-4 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="text-center">
          <div className={`tabular-nums text-5xl font-bold ${minute >= 90 ? (eliminated ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-100'}`}>{minute}'</div>
          <div className="mt-1 text-xs text-slate-500">
            {minute >= 90 ? (eliminated ? '❌ TICKET ELIMINATED' : correctPicks === matches.length ? '🏆 ALL CORRECT!' : 'FULL TIME') : isRunning ? '⚽ In Progress' : 'Ready to kick off'}
          </div>
          <div className="mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-100" style={{ width: `${(minute / 90) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Correct Picks</div>
          <div className="tabular-nums text-2xl font-bold text-emerald-400">{correctPicks}/{matches.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Survival Rate</div>
          <div className="tabular-nums text-2xl font-bold text-blue-400">
            {totalResolved > 0 ? `${((correctPicks / totalResolved) * 100).toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase">Goals</div>
          <div className="tabular-nums text-2xl font-bold text-amber-400">{goalEvents.length}</div>
        </div>
      </div>

      {/* Match Results */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="space-y-1.5">
          {matches.map((match, i) => {
            const score = scores[i];
            const result = results[i];
            const isCorrect = result ? selections[i].includes(result) : null;
            return (
              <div key={match.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${isCorrect === true ? 'bg-emerald-500/10' : isCorrect === false ? 'bg-rose-500/10' : 'bg-slate-800/40'}`}>
                <span className="tabular-nums w-5 text-[10px] text-slate-600">{match.id}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{match.homeTeam}</span>
                <span className="tabular-nums text-sm font-bold text-slate-200">
                  {score.home} - {score.away}
                </span>
                <span className="flex-1 text-right text-xs text-slate-300 truncate">{match.awayTeam}</span>
                {result && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal Events Feed */}
      {goalEvents.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-xs font-medium text-slate-400">Goal Events</h3>
          <div className="max-h-32 space-y-1 overflow-y-auto scrollbar-thin">
            {[...goalEvents].reverse().map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="tabular-nums text-slate-600">{e.minute}'</span>
                <span className="text-slate-400">⚽</span>
                <span className="text-slate-400">{matches[e.matchIdx][e.team === 'home' ? 'homeTeam' : 'awayTeam']} ({matches[e.matchIdx].homeTeam} {scores[e.matchIdx].home} - {scores[e.matchIdx].away} {matches[e.matchIdx].awayTeam})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SUB-JACKPOT SELECTOR ============
function SubJackpotSelector({ onSelect }: { onSelect: (count: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const subJackpots = [13, 14, 15, 16];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Shield size={12} />
        Sub-Jackpot
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl animate-slide-up">
          <button
            onClick={() => { onSelect(17); setIsOpen(false); }}
            className="w-full rounded-md px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
          >
            Full MJP 17 <span className="text-slate-600">· KES 99</span>
          </button>
          {subJackpots.map(n => (
            <button
              key={n}
              onClick={() => { onSelect(n); setIsOpen(false); }}
              className="w-full rounded-md px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
            >
              MJP {n} <span className="text-slate-600">· Exclude {17 - n} · Pool varies</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ SLIP HISTORY PANEL ============
function SlipHistory({ slips, onDelete, onRestore }: {
  slips: { id: string; jackpotType: string; selections: Selection[][]; totalCombinations: number; totalPrice: number; smsCode: string; createdAt: string; strategy: string }[];
  onDelete: (id: string) => void;
  onRestore: (slip: { selections: Selection[][]; jackpotType: 'mega' | 'midweek' }) => void;
}) {
  if (slips.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <History size={24} className="mx-auto mb-2 text-slate-700" />
        <p className="text-xs text-slate-500">No saved slips yet</p>
        <p className="text-[10px] text-slate-600 mt-1">Save your current slip from the Slip view</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slips.map(slip => (
        <div key={slip.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${slip.jackpotType === 'mega' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                {slip.jackpotType === 'mega' ? 'MJP' : 'MW'}
              </span>
              <span className="text-xs font-medium text-slate-300">{slip.strategy}</span>
              <span className="tabular-nums text-[10px] text-slate-600">{slip.totalCombinations} lines</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="tabular-nums text-[10px] text-slate-500 truncate max-w-[200px]">{slip.smsCode}</code>
              <span className="text-[10px] text-slate-600">
                {new Date(slip.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums text-xs font-medium text-emerald-400">KES {slip.totalPrice.toLocaleString()}</span>
            <button
              onClick={() => onRestore({ selections: slip.selections, jackpotType: slip.jackpotType as 'mega' | 'midweek' })}
              className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              Restore
            </button>
            <button
              onClick={() => onDelete(slip.id)}
              className="rounded bg-slate-800 px-2 py-1 text-[10px] text-rose-400/60 hover:text-rose-400 hover:bg-slate-700"
            >
              <X size={10} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [view, setView] = useState<ViewMode>('matches');
  const [jackpotType, setJackpotType] = useState<'mega' | 'midweek'>('mega');
  const [activeStrategy, setActiveStrategy] = useState('balanced');
  const [showSlumpOnly, setShowSlumpOnly] = useState(false);
  const [matchCount, setMatchCount] = useState(17);
  const [showParser, setShowParser] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMatchForTimeline, setSelectedMatchForTimeline] = useState<number | null>(1);
  const { savedSlips, saveSlip, deleteSlip, session, initSession, updateSession } = usePersistence();

  const currentJackpot = jackpotType === 'mega' ? megaJackpot : midweekJackpot;
  const matches = useMemo(() => {
    if (jackpotType === 'midweek') return currentJackpot.matches;
    return currentJackpot.matches.slice(0, matchCount);
  }, [jackpotType, matchCount, currentJackpot]);

  const [selections, setSelections] = useState<Selection[][]>(() => {
    const strategies = generateStrategies(megaJackpot.matches);
    const balanced = strategies.find(s => s.id === 'balanced')!;
    return balanced.picks.map(p => [p]);
  });

  useEffect(() => {
    const strategies = generateStrategies(matches);
    const strategy = strategies.find(s => s.id === activeStrategy) || strategies[1];
    setSelections(strategy.picks.map(p => [p]));
  }, [activeStrategy, jackpotType, matchCount]);

  // Session restoration
  useEffect(() => {
    if (session) {
      setJackpotType(session.jackpotType);
      setActiveStrategy(session.activeStrategy);
      setMatchCount(session.matchCount);
    } else {
      initSession({ jackpotType: 'mega', activeStrategy: 'balanced', matchCount: 17 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist session changes
  useEffect(() => {
    updateSession({ jackpotType, activeStrategy, matchCount });
  }, [jackpotType, activeStrategy, matchCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveSlip = useCallback(() => {
    saveSlip({
      jackpotType,
      selections,
      totalCombinations: calculatePermutations(selections),
      totalPrice: calculatePermutations(selections) * currentJackpot.stake,
      strategy: activeStrategy,
      smsCode: formatSMS(selections, jackpotType),
    });
  }, [jackpotType, selections, activeStrategy, currentJackpot.stake, saveSlip]);

  const handleRestoreSlip = useCallback((slip: { selections: Selection[][]; jackpotType: 'mega' | 'midweek' }) => {
    setSelections(slip.selections);
    setJackpotType(slip.jackpotType);
    setView('slip');
  }, []);

  const handleSelectionChange = useCallback((index: number, selection: Selection[]) => {
    setSelections(prev => {
      const next = [...prev];
      next[index] = selection;
      return next;
    });
  }, []);

  const handleApplyOptimized = useCallback((newSelections: Selection[][]) => {
    setSelections(newSelections);
    setView('slip');
  }, []);

  const handleSubJackpot = useCallback((count: number) => {
    setMatchCount(count);
  }, []);

  const totalCombinations = useMemo(() => calculatePermutations(selections), [selections]);
  const totalPrice = totalCombinations * currentJackpot.stake;

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar
        view={view}
        setView={setView}
        jackpotType={jackpotType}
        setJackpotType={setJackpotType}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-6">
        {/* Jackpot Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${jackpotType === 'mega' ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}>
              {jackpotType === 'mega' ? <Trophy size={20} className="text-emerald-400" /> : <Clock size={20} className="text-blue-400" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{currentJackpot.name}</h1>
              <p className="text-xs text-slate-500">
                {matches.length} fixtures · KES {currentJackpot.stake}/line · Deadline {getCountdown(matches[0]?.kickoff || new Date())}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {jackpotType === 'mega' && <SubJackpotSelector onSelect={handleSubJackpot} />}
            <button
              onClick={() => setShowParser(true)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/25 transition-colors"
            >
              <Upload size={12} />
              Import
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showHistory ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <History size={12} />
              {savedSlips.length > 0 && <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">{savedSlips.length}</span>}
            </button>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5">
              <Flame size={12} className="text-amber-400" />
              <span className="tabular-nums text-xs font-medium text-slate-300">
                Est. Pool: KES {jackpotType === 'mega' ? '152,000,000' : '8,500,000'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <span>Selections: <span className="tabular-nums text-slate-300">{totalCombinations}</span> lines</span>
          <span>·</span>
          <span>Cost: <span className="tabular-nums text-emerald-400">KES {totalPrice.toLocaleString()}</span></span>
          <span>·</span>
          <span>Doubles: <span className="tabular-nums text-blue-400">{selections.filter(s => s.length === 2).length}</span></span>
          <span>·</span>
          <span>Slump matches: <span className="tabular-nums text-rose-400">{matches.filter(m => m.isSlump).length}</span></span>
        </div>

        {/* Slump Warning Banner */}
        {matches.some(m => m.isSlump) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2">
            <AlertTriangle size={14} className="text-rose-400" />
            <span className="text-xs text-rose-300">
              {matches.filter(m => m.isSlump).length} match{matches.filter(m => m.isSlump).length > 1 ? 'es' : ''} with negative momentum — teams on 3+ consecutive loss streaks
            </span>
            <button
              onClick={() => { setShowSlumpOnly(true); setView('matches'); }}
              className="ml-auto rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400 hover:bg-rose-500/30"
            >
              View Slump
            </button>
          </div>
        )}

        {/* Views */}
        {view === 'matches' && (
          <MatchGrid
            matches={matches}
            selections={selections}
            onSelectionChange={handleSelectionChange}
            showSlumpOnly={showSlumpOnly}
            onToggleSlump={() => setShowSlumpOnly(!showSlumpOnly)}
          />
        )}
        {view === 'strategies' && (
          <StrategiesView
            matches={matches}
            activeStrategy={activeStrategy}
            setActiveStrategy={setActiveStrategy}
          />
        )}
        {view === 'permutations' && (
          <PermutationsView
            matches={matches}
            selections={selections}
            onSelectionChange={handleSelectionChange}
            stake={currentJackpot.stake}
          />
        )}
        {view === 'budget' && (
          <BudgetOptimizer
            matches={matches}
            stake={currentJackpot.stake}
            onApply={handleApplyOptimized}
          />
        )}
        {view === 'slip' && (
          <SlipView
            matches={matches}
            selections={selections}
            stake={currentJackpot.stake}
            jackpotType={jackpotType}
            onSave={handleSaveSlip}
            onPrint={() => setShowPrint(true)}
          />
        )}
        {view === 'simulator' && (
          <SimulatorView
            matches={matches}
            selections={selections}
          />
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="mt-6 animate-slide-up">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <History size={14} className="text-slate-400" />
                Saved Slips
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-xs text-slate-500 hover:text-slate-300">
                Close
              </button>
            </div>
            <SlipHistory
              slips={savedSlips}
              onDelete={deleteSlip}
              onRestore={handleRestoreSlip}
            />
          </div>
        )}

        {/* Odds Drift Timeline */}
        {view === 'matches' && matches.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Odds Movement</h3>
              <select
                value={selectedMatchForTimeline || 1}
                onChange={e => setSelectedMatchForTimeline(Number(e.target.value))}
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-slate-700"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.id}. {m.homeTeam} vs {m.awayTeam}</option>
                ))}
              </select>
            </div>
            <OddsTimeline matches={matches} selectedMatchId={selectedMatchForTimeline} />
          </div>
        )}
      </main>

      {/* Modals */}
      <ParserModal
        isOpen={showParser}
        onClose={() => setShowParser(false)}
        onParseComplete={() => {
          // Parsed data would be loaded into the grid
          setShowParser(false);
        }}
      />
      <PrintableSlip
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        matches={matches}
        selections={selections}
        stake={currentJackpot.stake}
        jackpotType={jackpotType}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center">
        <p className="text-[10px] text-slate-600">
          JackpotIQ Analytics · For research & entertainment purposes only · Gamble responsibly · 18+ only
        </p>
        <p className="mt-1 text-[10px] text-slate-700">
          SportPesa Mega Jackpot Pro · Midweek Jackpot · Permutation Generator · Predictive Analytics
        </p>
      </footer>
    </div>
  );
}
