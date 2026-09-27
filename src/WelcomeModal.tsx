import { Trophy, Zap, Target, BarChart3, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-violet-500/20 p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Welcome to JackpotIQ</h1>
            <p className="mt-2 text-sm text-slate-400">
              SportPesa Mega Jackpot Analytics & Predictive Permutation Generator
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {[
            {
              icon: <Target size={20} className="text-emerald-400" />,
              title: 'Dual Jackpot Support',
              desc: 'Mega Jackpot Pro (17 matches) and Midweek Jackpot (13 matches) with sub-jackpot tiers',
            },
            {
              icon: <Zap size={20} className="text-amber-400" />,
              title: 'Multi-Strategy Engine',
              desc: 'Conservative, AI Balanced, and Bold Value strategies with consensus scoring',
            },
            {
              icon: <BarChart3 size={20} className="text-blue-400" />,
              title: 'Permutation Calculator',
              desc: 'Smart budget optimizer with knapsack algorithm for maximum coverage',
            },
            {
              icon: <Sparkles size={20} className="text-violet-400" />,
              title: 'Advanced Analytics',
              desc: 'Odds drift tracking, form sparklines, H2H analysis, and confidence heatmaps',
            },
          ].map((feature, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{feature.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Guide */}
        <div className="border-t border-slate-800 px-6 py-4">
          <h3 className="mb-3 text-sm font-bold text-slate-200">Quick Start Guide</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">1</span>
              <span>Review fixtures in the <strong className="text-slate-300">Fixtures</strong> tab · Click any match for H2H details</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400">2</span>
              <span>Choose a strategy in the <strong className="text-slate-300">Strategies</strong> tab · View consensus matrix</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">3</span>
              <span>Optimize coverage in <strong className="text-slate-300">Permutations</strong> or <strong className="text-slate-300">Budget</strong> tabs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">4</span>
              <span>Generate your slip in the <strong className="text-slate-300">Slip</strong> tab · Copy SMS code or export</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-slate-800 px-6 py-4">
          <h3 className="mb-2 text-xs font-bold text-slate-400">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] md:grid-cols-4">
            {[
              { keys: '1-6', action: 'Switch tabs' },
              { keys: 'M', action: 'Mega Jackpot' },
              { keys: 'W', action: 'Midweek' },
              { keys: 'S', action: 'Save slip' },
            ].map((shortcut, i) => (
              <div key={i} className="flex items-center gap-2">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">{shortcut.keys}</kbd>
                <span className="text-slate-500">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-slate-800 p-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
          >
            Get Started →
          </button>
          <p className="mt-3 text-center text-[10px] text-slate-600">
            For research & entertainment purposes · Gamble responsibly · 18+ only
          </p>
        </div>
      </div>
    </div>
  );
}
