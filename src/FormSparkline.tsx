import { useMemo } from 'react';

interface FormSparklineProps {
  form: string; // e.g., "WWDWL"
  team: string;
  color?: string;
}

// Convert form string to numeric values for sparkline
// W = 3 points, D = 1 point, L = 0 points
function formToPoints(form: string): number[] {
  return form.split('').map(r => {
    if (r === 'W') return 3;
    if (r === 'D') return 1;
    return 0;
  });
}

export default function FormSparkline({ form, team, color = '#10b981' }: FormSparklineProps) {
  const points = useMemo(() => formToPoints(form), [form]);
  const maxPoints = 3;
  const width = 80;
  const height = 24;
  const padding = 2;

  const pathData = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
    const y = height - padding - (p / maxPoints) * (height - 2 * padding);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Calculate form trend
  const recentAvg = points.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const olderAvg = points.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, points.length - 3);
  const trend = recentAvg - olderAvg;

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background grid */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="0.5" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeWidth="0.5" />
        
        {/* Form line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points */}
        {points.map((p, i) => {
          const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
          const y = height - padding - (p / maxPoints) * (height - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={p === 3 ? '#10b981' : p === 1 ? '#f59e0b' : '#f43f5e'}
            />
          );
        })}
      </svg>
      
      {/* Trend indicator */}
      <div className="flex flex-col">
        <span className="text-[9px] text-slate-500">{team}</span>
        <span className={`tabular-nums text-[10px] font-medium ${trend > 0.5 ? 'text-emerald-400' : trend < -0.5 ? 'text-rose-400' : 'text-slate-400'}`}>
          {trend > 0.5 ? '↑' : trend < -0.5 ? '↓' : '→'} {recentAvg.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
