import { describe, it, expect } from 'vitest';
import {
  megaJackpot, midweekJackpot, generateStrategies,
  calculatePermutations, formatSMS, getCountdown,
  optimizeBudget, generateConservativeStrategy,
  generateBoldStrategy, generateBalancedStrategy
} from './data';
import type { Match, Selection } from './types';

describe('Coupon Health', () => {
  it('Mega Jackpot has exactly 17 matches', () => {
    expect(megaJackpot.matches).toHaveLength(17);
    expect(megaJackpot.totalMatches).toBe(17);
  });

  it('Midweek Jackpot has exactly 13 matches', () => {
    expect(midweekJackpot.matches).toHaveLength(13);
    expect(midweekJackpot.totalMatches).toBe(13);
  });

  it('All matches have valid odds (positive numbers)', () => {
    [...megaJackpot.matches, ...midweekJackpot.matches].forEach(match => {
      expect(match.odds['1']).toBeGreaterThan(1);
      expect(match.odds['X']).toBeGreaterThan(1);
      expect(match.odds['2']).toBeGreaterThan(1);
    });
  });

  it('All matches have unique IDs within their jackpot', () => {
    const megaIds = megaJackpot.matches.map(m => m.id);
    const midweekIds = midweekJackpot.matches.map(m => m.id);
    expect(new Set(megaIds).size).toBe(megaIds.length);
    expect(new Set(midweekIds).size).toBe(midweekIds.length);
  });

  it('All matches have team names', () => {
    [...megaJackpot.matches, ...midweekJackpot.matches].forEach(match => {
      expect(match.homeTeam.length).toBeGreaterThan(0);
      expect(match.awayTeam.length).toBeGreaterThan(0);
    });
  });

  it('Stake is KES 99 for both jackpots', () => {
    expect(megaJackpot.stake).toBe(99);
    expect(midweekJackpot.stake).toBe(99);
  });

  it('All matches have future kickoff dates', () => {
    const now = new Date();
    [...megaJackpot.matches, ...midweekJackpot.matches].forEach(match => {
      expect(match.kickoff.getTime()).toBeGreaterThan(now.getTime() - 86400000); // Allow 1 day tolerance
    });
  });
});

describe('Slump Filtering', () => {
  it('Mega Jackpot has at least one slump match', () => {
    const slumpMatches = megaJackpot.matches.filter(m => m.isSlump);
    expect(slumpMatches.length).toBeGreaterThan(0);
  });

  it('Slump matches have form indicating losses', () => {
    const slumpMatches = megaJackpot.matches.filter(m => m.isSlump);
    slumpMatches.forEach(match => {
      // At least one team should have multiple L's in their form
      const homeLs = (match.form.home.match(/L/g) || []).length;
      const awayLs = (match.form.away.match(/L/g) || []).length;
      expect(homeLs + awayLs).toBeGreaterThanOrEqual(2);
    });
  });

  it('Filtering by slump returns only slump matches', () => {
    const filtered = megaJackpot.matches.filter(m => m.isSlump);
    filtered.forEach(m => {
      expect(m.isSlump).toBe(true);
    });
  });
});

describe('Permutation Math', () => {
  it('Single picks = 1 combination', () => {
    const selections: Selection[][] = [['1'], ['X'], ['2'], ['1']];
    expect(calculatePermutations(selections)).toBe(1);
  });

  it('One double = 2 combinations', () => {
    const selections: Selection[][] = [['1', 'X'], ['2'], ['1']];
    expect(calculatePermutations(selections)).toBe(2);
  });

  it('Two doubles = 4 combinations', () => {
    const selections: Selection[][] = [['1', 'X'], ['X', '2'], ['1']];
    expect(calculatePermutations(selections)).toBe(4);
  });

  it('Triple chance = 3 combinations per leg', () => {
    const selections: Selection[][] = [['1', 'X', '2'], ['1']];
    expect(calculatePermutations(selections)).toBe(3);
  });

  it('7 doubles = 128 combinations', () => {
    const selections: Selection[][] = [
      ['1', 'X'], ['1', 'X'], ['1', 'X'], ['1', 'X'],
      ['1', 'X'], ['1', 'X'], ['1', 'X'], ['1'],
      ['2'], ['2'], ['2'], ['2'], ['2'], ['2'],
      ['2'], ['2'], ['2']
    ];
    expect(calculatePermutations(selections)).toBe(128);
  });

  it('17 single picks = 1 combination', () => {
    const selections: Selection[][] = Array(17).fill(null).map(() => ['1'] as Selection[]);
    expect(calculatePermutations(selections)).toBe(1);
  });

  it('Mixed selections calculate correctly', () => {
    const selections: Selection[][] = [['1', 'X'], ['2'], ['1', 'X', '2'], ['1']];
    expect(calculatePermutations(selections)).toBe(2 * 1 * 3 * 1);
  });
});

describe('SMS Code Formatting', () => {
  it('Generates MJP prefix for mega jackpot', () => {
    const selections: Selection[][] = [['1'], ['X'], ['2']];
    const code = formatSMS(selections, 'mega');
    expect(code).toMatch(/^MJP#/);
  });

  it('Generates MWJ prefix for midweek jackpot', () => {
    const selections: Selection[][] = [['1'], ['X'], ['2']];
    const code = formatSMS(selections, 'midweek');
    expect(code).toMatch(/^MWJ#/);
  });

  it('Single picks use single characters', () => {
    const selections: Selection[][] = [['1'], ['X'], ['2']];
    const code = formatSMS(selections, 'mega');
    expect(code).toBe('MJP#1X2');
  });

  it('Double chance 1X uses A', () => {
    const selections: Selection[][] = [['1', 'X'], ['2']];
    const code = formatSMS(selections, 'mega');
    expect(code).toBe('MJP#A2');
  });

  it('Double chance X2 uses C', () => {
    const selections: Selection[][] = [['X', '2'], ['1']];
    const code = formatSMS(selections, 'mega');
    expect(code).toBe('MJP#C1');
  });

  it('Double chance 12 uses B', () => {
    const selections: Selection[][] = [['1', '2'], ['X']];
    const code = formatSMS(selections, 'mega');
    expect(code).toBe('MJP#BX');
  });

  it('Triple chance uses T', () => {
    const selections: Selection[][] = [['1', 'X', '2'], ['1']];
    const code = formatSMS(selections, 'mega');
    expect(code).toBe('MJP#T1');
  });
});

describe('Strategy Generation', () => {
  it('Generates 3 strategies', () => {
    const strategies = generateStrategies(megaJackpot.matches);
    expect(strategies).toHaveLength(3);
  });

  it('Conservative strategy picks lowest odds', () => {
    const picks = generateConservativeStrategy(megaJackpot.matches);
    picks.forEach((pick, i) => {
      const match = megaJackpot.matches[i];
      const lowest = Math.min(match.odds['1'], match.odds['X'], match.odds['2']);
      const expectedPick = match.odds['1'] === lowest ? '1' : match.odds['2'] === lowest ? '2' : 'X';
      expect(pick).toBe(expectedPick);
    });
  });

  it('Bold strategy picks highest odds', () => {
    const picks = generateBoldStrategy(megaJackpot.matches);
    picks.forEach((pick, i) => {
      const match = megaJackpot.matches[i];
      const highest = Math.max(match.odds['1'], match.odds['X'], match.odds['2']);
      const expectedPick = match.odds['1'] === highest ? '1' : match.odds['2'] === highest ? '2' : 'X';
      expect(pick).toBe(expectedPick);
    });
  });

  it('Balanced strategy returns valid picks', () => {
    const picks = generateBalancedStrategy(megaJackpot.matches);
    picks.forEach(pick => {
      expect(['1', 'X', '2']).toContain(pick);
    });
  });

  it('All strategies have correct number of picks', () => {
    const strategies = generateStrategies(megaJackpot.matches);
    strategies.forEach(strategy => {
      expect(strategy.picks).toHaveLength(17);
    });
  });

  it('Strategies have unique IDs and names', () => {
    const strategies = generateStrategies(megaJackpot.matches);
    const ids = strategies.map(s => s.id);
    const names = strategies.map(s => s.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Budget Optimizer', () => {
  it('Returns valid optimization within budget', () => {
    const result = optimizeBudget(megaJackpot.matches, 9900, 99, 7);
    expect(result.totalCost).toBeLessThanOrEqual(9900);
    expect(result.totalCombinations).toBeGreaterThan(0);
  });

  it('Does not exceed max doubles', () => {
    const result = optimizeBudget(megaJackpot.matches, 99000, 99, 7);
    expect(result.doubles.length).toBeLessThanOrEqual(7);
  });

  it('Budget of 99 = 1 combination', () => {
    const result = optimizeBudget(megaJackpot.matches, 99, 99, 7);
    expect(result.totalCombinations).toBe(1);
    expect(result.totalCost).toBe(99);
  });

  it('Selections array matches match count', () => {
    const result = optimizeBudget(megaJackpot.matches, 9900, 99, 7);
    expect(result.selections).toHaveLength(17);
  });

  it('Midweek max doubles is 2', () => {
    const result = optimizeBudget(midweekJackpot.matches, 9900, 99, 2);
    expect(result.doubles.length).toBeLessThanOrEqual(2);
  });
});

describe('Countdown Timer', () => {
  it('Returns LIVE for past dates', () => {
    const pastDate = new Date(Date.now() - 86400000);
    expect(getCountdown(pastDate)).toBe('LIVE');
  });

  it('Returns formatted string for future dates', () => {
    const futureDate = new Date(Date.now() + 86400000 * 3);
    const result = getCountdown(futureDate);
    expect(result).toMatch(/\d+d \d+h/);
  });

  it('Returns hours for near-future dates', () => {
    const futureDate = new Date(Date.now() + 3600000 * 5);
    const result = getCountdown(futureDate);
    expect(result).toMatch(/\d+h \d+m/);
  });
});

describe('Modal States', () => {
  it('Selection arrays are never empty', () => {
    const strategies = generateStrategies(megaJackpot.matches);
    strategies.forEach(strategy => {
      strategy.picks.forEach(pick => {
        expect(pick).toBeTruthy();
      });
    });
  });

  it('All picks are valid outcomes', () => {
    const strategies = generateStrategies(megaJackpot.matches);
    strategies.forEach(strategy => {
      strategy.picks.forEach(pick => {
        expect(['1', 'X', '2']).toContain(pick);
      });
    });
  });
});
