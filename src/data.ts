import { Match, Jackpot, Strategy, Selection } from './types';

const now = new Date();
const nextSaturday = new Date(now);
nextSaturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
nextSaturday.setHours(15, 0, 0, 0);

const nextWednesday = new Date(now);
nextWednesday.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
if (nextWednesday <= now) nextWednesday.setDate(nextWednesday.getDate() + 7);
nextWednesday.setHours(19, 0, 0, 0);

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export const megaJackpotMatches: Match[] = [
  { id: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'EPL', kickoff: addHours(nextSaturday, 0), odds: { '1': 1.72, 'X': 3.60, '2': 4.80 }, form: { home: 'WWDWW', away: 'DLWLD' }, h2h: '3-1-2', confidence: 78 },
  { id: 2, homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', league: 'La Liga', kickoff: addHours(nextSaturday, 1), odds: { '1': 1.85, 'X': 3.40, '2': 4.20 }, form: { home: 'WWWDW', away: 'WDWDW' }, h2h: '4-2-1', confidence: 72 },
  { id: 3, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', league: 'Bundesliga', kickoff: addHours(nextSaturday, 1.5), odds: { '1': 1.55, 'X': 4.10, '2': 5.50 }, form: { home: 'WWWDL', away: 'LWDWW' }, h2h: '5-1-0', confidence: 82 },
  { id: 4, homeTeam: 'AC Milan', awayTeam: 'Inter Milan', league: 'Serie A', kickoff: addHours(nextSaturday, 2), odds: { '1': 2.80, 'X': 3.10, '2': 2.60 }, form: { home: 'WDWLW', away: 'WWWDW' }, h2h: '2-3-3', confidence: 55 },
  { id: 5, homeTeam: 'PSG', awayTeam: 'Lyon', league: 'Ligue 1', kickoff: addHours(nextSaturday, 2.5), odds: { '1': 1.45, 'X': 4.50, '2': 6.50 }, form: { home: 'WWWWW', away: 'DLLWL' }, h2h: '6-0-0', confidence: 88 },
  { id: 6, homeTeam: 'Man City', awayTeam: 'Liverpool', league: 'EPL', kickoff: addHours(nextSaturday, 3), odds: { '1': 2.10, 'X': 3.50, '2': 3.30 }, form: { home: 'WDWWL', away: 'WWWDW' }, h2h: '3-2-3', confidence: 62 },
  { id: 7, homeTeam: 'Juventus', awayTeam: 'Napoli', league: 'Serie A', kickoff: addHours(nextSaturday, 3.5), odds: { '1': 2.30, 'X': 3.20, '2': 3.10 }, form: { home: 'DWDWW', away: 'LLWDL' }, h2h: '2-4-2', confidence: 58 },
  { id: 8, homeTeam: 'Real Madrid', awayTeam: 'Sevilla', league: 'La Liga', kickoff: addHours(nextSaturday, 4), odds: { '1': 1.40, 'X': 4.60, '2': 7.00 }, form: { home: 'WWWDW', away: 'LDLLW' }, h2h: '7-1-0', confidence: 85 },
  { id: 9, homeTeam: 'Tottenham', awayTeam: 'Man United', league: 'EPL', kickoff: addHours(nextSaturday, 4.5), odds: { '1': 2.20, 'X': 3.40, '2': 3.20 }, form: { home: 'WLDWW', away: 'LLDLL' }, h2h: '3-2-3', confidence: 60, isSlump: true },
  { id: 10, homeTeam: 'Ajax', awayTeam: 'PSV', league: 'Eredivisie', kickoff: addHours(nextSaturday, 5), odds: { '1': 2.40, 'X': 3.30, '2': 2.90 }, form: { home: 'WWDLW', away: 'WWWDL' }, h2h: '3-1-4', confidence: 56 },
  { id: 11, homeTeam: 'Porto', awayTeam: 'Benfica', league: 'Liga Portugal', kickoff: addHours(nextSaturday, 5.5), odds: { '1': 2.50, 'X': 3.20, '2': 2.80 }, form: { home: 'WDWWW', away: 'WWDLW' }, h2h: '2-3-3', confidence: 54 },
  { id: 12, homeTeam: 'Celtic', awayTeam: 'Rangers', league: 'Scottish Prem', kickoff: addHours(nextSaturday, 6), odds: { '1': 1.90, 'X': 3.50, '2': 4.00 }, form: { home: 'WWWDW', away: 'DLLWW' }, h2h: '4-2-2', confidence: 70 },
  { id: 13, homeTeam: 'Galatasaray', awayTeam: 'Fenerbahce', league: 'Super Lig', kickoff: addHours(nextSaturday, 6.5), odds: { '1': 2.00, 'X': 3.30, '2': 3.60 }, form: { home: 'WWDWW', away: 'WDLDW' }, h2h: '4-3-1', confidence: 65 },
  { id: 14, homeTeam: 'Boca Juniors', awayTeam: 'River Plate', league: 'Liga Arg.', kickoff: addHours(nextSaturday, 7), odds: { '1': 2.60, 'X': 2.90, '2': 2.90 }, form: { home: 'DWDWL', away: 'WWDWW' }, h2h: '2-4-4', confidence: 48, isSlump: true },
  { id: 15, homeTeam: 'Flamengo', awayTeam: 'Palmeiras', league: 'Brasileirão', kickoff: addHours(nextSaturday, 7.5), odds: { '1': 2.10, 'X': 3.10, '2': 3.50 }, form: { home: 'WWLWW', away: 'WDLWW' }, h2h: '3-2-3', confidence: 63 },
  { id: 16, homeTeam: 'Al Ahly', awayTeam: 'Zamalek', league: 'Egyptian Prem', kickoff: addHours(nextSaturday, 8), odds: { '1': 1.80, 'X': 3.30, '2': 4.50 }, form: { home: 'WWWDW', away: 'LDLWL' }, h2h: '5-2-1', confidence: 75 },
  { id: 17, homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'KPL', kickoff: addHours(nextSaturday, 8.5), odds: { '1': 1.95, 'X': 3.00, '2': 4.20 }, form: { home: 'WDWWW', away: 'LDLLD' }, h2h: '4-3-1', confidence: 71 },
];

export const midweekJackpotMatches: Match[] = [
  { id: 1, homeTeam: 'Wolves', awayTeam: 'Everton', league: 'EPL', kickoff: addHours(nextWednesday, 0), odds: { '1': 2.10, 'X': 3.20, '2': 3.50 }, form: { home: 'WDWLD', away: 'LLDLL' }, h2h: '3-2-2', confidence: 62, isSlump: true },
  { id: 2, homeTeam: 'Real Sociedad', awayTeam: 'Villarreal', league: 'La Liga', kickoff: addHours(nextWednesday, 0.5), odds: { '1': 2.30, 'X': 3.10, '2': 3.20 }, form: { home: 'WWDWL', away: 'WDWWL' }, h2h: '2-3-3', confidence: 55 },
  { id: 3, homeTeam: 'Leverkusen', awayTeam: 'Leipzig', league: 'Bundesliga', kickoff: addHours(nextWednesday, 1), odds: { '1': 1.90, 'X': 3.50, '2': 3.90 }, form: { home: 'WWWDW', away: 'WDLWW' }, h2h: '3-1-2', confidence: 70 },
  { id: 4, homeTeam: 'Roma', awayTeam: 'Lazio', league: 'Serie A', kickoff: addHours(nextWednesday, 1.5), odds: { '1': 2.40, 'X': 3.10, '2': 3.00 }, form: { home: 'DWWLD', away: 'WWDLW' }, h2h: '2-3-3', confidence: 52 },
  { id: 5, homeTeam: 'Marseille', awayTeam: 'Monaco', league: 'Ligue 1', kickoff: addHours(nextWednesday, 2), odds: { '1': 2.20, 'X': 3.30, '2': 3.20 }, form: { home: 'WWDLW', away: 'WDWWW' }, h2h: '3-2-3', confidence: 58 },
  { id: 6, homeTeam: 'Newcastle', awayTeam: 'Aston Villa', league: 'EPL', kickoff: addHours(nextWednesday, 2.5), odds: { '1': 2.00, 'X': 3.40, '2': 3.60 }, form: { home: 'WWDWW', away: 'LDWLW' }, h2h: '3-2-2', confidence: 66 },
  { id: 7, homeTeam: 'Athletic Bilbao', awayTeam: 'Betis', league: 'La Liga', kickoff: addHours(nextWednesday, 3), odds: { '1': 1.75, 'X': 3.50, '2': 4.50 }, form: { home: 'WDWWW', away: 'DLLDW' }, h2h: '4-2-1', confidence: 76 },
  { id: 8, homeTeam: 'Fiorentina', awayTeam: 'Atalanta', league: 'Serie A', kickoff: addHours(nextWednesday, 3.5), odds: { '1': 2.70, 'X': 3.20, '2': 2.60 }, form: { home: 'WLDWW', away: 'WWWDW' }, h2h: '2-2-4', confidence: 50 },
  { id: 9, homeTeam: 'Lille', awayTeam: 'Rennes', league: 'Ligue 1', kickoff: addHours(nextWednesday, 4), odds: { '1': 2.00, 'X': 3.30, '2': 3.70 }, form: { home: 'WWDLW', away: 'LDLDW' }, h2h: '3-3-1', confidence: 64 },
  { id: 10, homeTeam: 'Feyenoord', awayTeam: 'AZ Alkmaar', league: 'Eredivisie', kickoff: addHours(nextWednesday, 4.5), odds: { '1': 1.85, 'X': 3.60, '2': 4.00 }, form: { home: 'WWWDL', away: 'WDLWW' }, h2h: '4-1-2', confidence: 73 },
  { id: 11, homeTeam: 'Sporting CP', awayTeam: 'Braga', league: 'Liga Portugal', kickoff: addHours(nextWednesday, 5), odds: { '1': 1.65, 'X': 3.80, '2': 5.00 }, form: { home: 'WWWWW', away: 'WDLDW' }, h2h: '5-1-1', confidence: 80 },
  { id: 12, homeTeam: 'Toulouse', awayTeam: 'Nice', league: 'Ligue 1', kickoff: addHours(nextWednesday, 5.5), odds: { '1': 2.50, 'X': 3.10, '2': 2.90 }, form: { home: 'DLLWD', away: 'WWDWL' }, h2h: '2-2-3', confidence: 49, isSlump: true },
  { id: 13, homeTeam: 'Turan', awayTeam: 'KCB', league: 'KPL', kickoff: addHours(nextWednesday, 6), odds: { '1': 2.20, 'X': 3.00, '2': 3.40 }, form: { home: 'WDWLW', away: 'LDLLW' }, h2h: '3-2-2', confidence: 60 },
];

export const megaJackpot: Jackpot = {
  type: 'mega',
  name: 'Mega Jackpot Pro',
  totalMatches: 17,
  stake: 99,
  matches: megaJackpotMatches,
};

export const midweekJackpot: Jackpot = {
  type: 'midweek',
  name: 'Midweek Jackpot',
  totalMatches: 13,
  stake: 99,
  matches: midweekJackpotMatches,
};

export function generateConservativeStrategy(matches: Match[]): Selection[] {
  return matches.map(m => {
    const lowest = Math.min(m.odds['1'], m.odds['X'], m.odds['2']);
    if (lowest === m.odds['1']) return '1';
    if (lowest === m.odds['2']) return '2';
    return 'X';
  });
}

export function generateBoldStrategy(matches: Match[]): Selection[] {
  return matches.map(m => {
    const highest = Math.max(m.odds['1'], m.odds['X'], m.odds['2']);
    if (highest === m.odds['1']) return '1';
    if (highest === m.odds['2']) return '2';
    return 'X';
  });
}

export function generateBalancedStrategy(matches: Match[]): Selection[] {
  return matches.map(m => {
    const { '1': o1, 'X': oX, '2': o2 } = m.odds;
    const implied1 = 1 / o1;
    const impliedX = 1 / oX;
    const implied2 = 1 / o2;
    const total = implied1 + impliedX + implied2;
    const ev1 = (implied1 / total) * o1;
    const evX = (impliedX / total) * oX;
    const ev2 = (implied2 / total) * o2;
    if (ev1 >= evX && ev1 >= ev2) return '1';
    if (evX >= ev1 && evX >= ev2) return 'X';
    return '2';
  });
}

export function generateStrategies(matches: Match[]): Strategy[] {
  return [
    { id: 'conservative', name: 'Conservative', description: 'Lowest odds favorites — safest picks', color: '#10b981', picks: generateConservativeStrategy(matches) },
    { id: 'balanced', name: 'AI Balanced', description: 'Expected-value optimized mix', color: '#3b82f6', picks: generateBalancedStrategy(matches) },
    { id: 'bold', name: 'Bold Value', description: 'High-EV upsets & contrarian draws', color: '#f59e0b', picks: generateBoldStrategy(matches) },
  ];
}

export function calculatePermutations(selections: Selection[][]): number {
  return selections.reduce((acc, sel) => acc * sel.length, 1);
}

export function formatSMS(selections: Selection[][], type: 'mega' | 'midweek'): string {
  const prefix = type === 'mega' ? 'MJP' : 'MWJ';
  const code = selections.map(s => {
    if (s.length === 1) return s[0];
    if (s.includes('1') && s.includes('X') && s.includes('2')) return 'T';
    if (s.includes('1') && s.includes('X')) return 'A';
    if (s.includes('1') && s.includes('2')) return 'B';
    if (s.includes('X') && s.includes('2')) return 'C';
    return s[0];
  }).join('');
  return `${prefix}#${code}`;
}

export function getCountdown(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 'LIVE';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getFormColor(result: string): string {
  switch (result) {
    case 'W': return 'bg-emerald-500';
    case 'D': return 'bg-amber-500';
    case 'L': return 'bg-rose-500';
    default: return 'bg-slate-600';
  }
}

export function optimizeBudget(matches: Match[], budget: number, stake: number, maxDoubles: number): { selections: Selection[][]; doubles: number[]; totalCost: number; totalCombinations: number } {
  const n = matches.length;
  const priorities = matches.map((m, i) => {
    const oddsRange = Math.max(m.odds['1'], m.odds['X'], m.odds['2']) - Math.min(m.odds['1'], m.odds['X'], m.odds['2']);
    return { index: i, priority: oddsRange * (1 - (m.confidence || 50) / 100) };
  }).sort((a, b) => b.priority - a.priority);

  const doubles: number[] = [];
  let combinations = 1;
  for (let i = 0; i < priorities.length && doubles.length < maxDoubles; i++) {
    const newCombinations = combinations * 2;
    if (newCombinations * stake <= budget) {
      combinations = newCombinations;
      doubles.push(priorities[i].index);
    }
  }

  const selections: Selection[][] = matches.map((m, i) => {
    if (doubles.includes(i)) {
      const sorted = Object.entries(m.odds).sort((a, b) => a[1] - b[1]);
      return [sorted[0][0] as Selection, sorted[1][0] as Selection];
    }
    const lowest = Object.entries(m.odds).sort((a, b) => a[1] - b[1])[0][0];
    return [lowest as Selection];
  });

  return { selections, doubles, totalCost: combinations * stake, totalCombinations: combinations };
}
