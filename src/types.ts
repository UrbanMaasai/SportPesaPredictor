export type Outcome = '1' | 'X' | '2';
export type Selection = Outcome | '1X' | 'X2' | '12' | '1X2';

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: Date;
  odds: { '1': number; 'X': number; '2': number };
  form: { home: string; away: string };
  h2h: string;
  prediction?: Selection;
  confidence?: number;
  isSlump?: boolean;
}

export interface Jackpot {
  type: 'mega' | 'midweek';
  name: string;
  totalMatches: number;
  stake: number;
  matches: Match[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  color: string;
  picks: Selection[];
}

export interface Slip {
  id: string;
  jackpotType: 'mega' | 'midweek';
  selections: Selection[][];
  totalCombinations: number;
  totalPrice: number;
  strategy: string;
  createdAt: Date;
}

export interface BudgetConfig {
  totalBudget: number;
  stakePerLine: number;
  maxDoubles: number;
}

export type ViewMode = 'matches' | 'strategies' | 'permutations' | 'budget' | 'slip' | 'simulator';
