# JackpotIQ — SportPesa Mega Jackpot Analytics Platform

A production-grade sports betting analytics platform and predictive permutation generator tailored for SportPesa Kenya's 17-match Mega Jackpot Pro and 13-match Midweek Jackpot.

## 🏆 Features

### Dual Jackpot Support
- **Mega Jackpot Pro (MJP 17)**: 17-match accumulator with KES 99 stake
- **Midweek Jackpot (MW 13)**: 13-match fixed coupon
- **Sub-jackpot tiers**: MJP 13, 14, 15, 16 by excluding matches
- **Permutation math**: ∏|Sᵢ| combinations, max 7 doubles (128 lines) for MJP

### Predictive Intelligence
- **Multi-Strategy Engine**: Conservative, AI Balanced, Bold Value strategies
- **Consensus Matrix**: Agreement scoring (33%/66%/100%) across models
- **Confidence Heatmap**: Visual grid showing prediction confidence per match
- **Form Sparklines**: Team form trends with W/D/L point tracking
- **H2H Analysis**: Head-to-head records with goal margin visualization
- **Slump Detection**: Negative momentum flagging (3+ loss streaks)

### Permutation & Budget Tools
- **Smart Budget Optimizer**: Knapsack algorithm for maximum coverage
- **Leg-by-Leg Coverage**: Interactive double/triple chance selection
- **Historical Backtesting**: 8-week hit rate analysis with payout tracking
- **Odds Drift Timeline**: 14-day historical odds movement charts

### Slip Output & Export
- **SportPesa SMS 79079**: Exact format with 1-click clipboard copy
- **JSON/CSV Export**: Full coupon schema download
- **Telegram Share**: Bold markdown format for syndicate channels
- **Printable Slip**: High-contrast digital betting ticket for PDF export

### Fixture Import
- **Text Parser**: Paste coupon tables for automatic parsing
- **Vision OCR**: Screenshot upload (simulated Gemini Vision)
- **Manual Entry**: Direct fixture input

### Live Matchday Simulator
- **90-Minute Clock**: Real-time progression with random goal events
- **Half-Time Results**: HT/FT tracking with survival analysis
- **Live Scoreboards**: Per-match score updates with ticket survival
- **Goal Events Feed**: Minute-by-minute goal log

### Data Visualization
- **Tactical Radar Chart**: SVG radar for match analytics
- **Predictability Trend**: 12-week sparkline chart
- **Odds Drift Indicators**: Per-match percentage change
- **Form Sparklines**: Team form over last 5 matches
- **Confidence Heatmap**: Color-coded prediction confidence grid

## 🎨 Design System

- **Typography**: Plus Jakarta Sans (UI), JetBrains Mono (tabular numbers)
- **Palette**: Dark slate with emerald/blue/amber accents
- **Tabular Figures**: `font-variant-numeric: tabular-nums` on all numbers
- **Animations**: Smooth slide-up transitions, pulse-glow effects
- **Responsive**: Mobile-first with adaptive segmented controls

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-6` | Switch between tabs |
| `M` | Mega Jackpot |
| `W` | Midweek Jackpot |
| `S` | Save slip (in Slip view) |

## 🧪 Testing

Comprehensive Vitest unit tests covering:
- Coupon health validation (match counts, odds, IDs, dates)
- Slump filtering correctness
- Permutation math (singles, doubles, triples, 7 doubles = 128)
- SMS code formatting (prefixes, double chance codes A/B/C, triple T)
- Strategy generation (conservative/bold/balanced)
- Budget optimizer constraints
- Countdown timer formatting
- Modal state validation

Run tests:
```bash
npm test
```

## 🏗️ Architecture

```
src/
├── App.tsx                 # Main application (1400+ lines)
├── types.ts               # TypeScript interfaces
├── data.ts                # Mock data & strategy algorithms
├── data.test.ts           # Unit tests (Vitest)
├── usePersistence.ts      # LocalStorage session management
├── ParserModal.tsx        # Fixture import (Text/OCR/Manual)
├── PrintableSlip.tsx      # Print/PDF export modal
├── OddsTimeline.tsx       # 14-day odds drift chart (SVG)
├── H2HDisplay.tsx         # Head-to-head visualization
├── FormSparkline.tsx      # Team form trend sparklines
├── ConfidenceHeatmap.tsx  # Prediction confidence grid
├── WelcomeModal.tsx       # First-time onboarding
├── index.css              # Tailwind CSS v4 + custom styles
└── main.tsx               # React entry point
```

## 🚀 Build

```bash
npm install
npm run build
```

Output: `dist/index.html` (static site, ~245KB JS gzipped)

## 📊 Data Model

### Match
```typescript
interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: Date;
  odds: { '1': number; 'X': number; '2': number };
  form: { home: string; away: string }; // e.g., "WWDWL"
  h2h: string; // e.g., "3-1-2" (home-draw-away)
  confidence?: number; // 0-100
  isSlump?: boolean;
}
```

### Selection
```typescript
type Outcome = '1' | 'X' | '2';
type Selection = Outcome | '1X' | 'X2' | '12' | '1X2';
```

## 🎯 Strategy Algorithms

### Conservative
Picks lowest odds (favorites) for each match.

### AI Balanced
Calculates expected value: `(implied_prob / total_implied) * odds`
Selects highest EV outcome per match.

### Bold Value
Picks highest odds (underdogs/upsets) for contrarian strategy.

## 📈 Permutation Calculation

```typescript
totalCombinations = selections.reduce((acc, sel) => acc * sel.length, 1);
totalPrice = totalCombinations * stake; // KES 99 per line
```

**Examples:**
- 17 singles = 1 combination = KES 99
- 16 singles + 1 double = 2 combinations = KES 198
- 10 singles + 7 doubles = 128 combinations = KES 12,672

## 🔐 Persistence

- **Session**: Jackpot type, strategy, match count (LocalStorage)
- **Saved Slips**: Up to 50 recent slips with restore/delete
- **First Visit**: Welcome modal shown once

## 📱 Responsive Design

- Mobile: Stacked layout, touch-friendly controls
- Tablet: 2-column grid for analytics
- Desktop: Full-width tables, side-by-side comparisons

## 🎨 Visual Components

### SVG Charts
- **Sparklines**: Form trends with point indicators
- **Radar Chart**: 6-axis tactical analysis
- **Odds Timeline**: Multi-line drift tracking
- **Heatmap**: Color-coded confidence grid

### Animations
- `slide-up`: Modal/panel entrance
- `pulse-glow`: Live indicators
- Smooth transitions on all interactive elements

## 📝 License

For research & entertainment purposes only. Gamble responsibly. 18+ only.

## 🙏 Acknowledgments

- SportPesa Kenya for jackpot format
- React + Vite + Tailwind CSS community
- JetBrains Mono & Plus Jakarta Sans typefaces

---

**Built with ❤️ for the Kenyan betting community**
