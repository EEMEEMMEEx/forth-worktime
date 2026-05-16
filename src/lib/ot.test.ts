import { describe, expect, it } from 'vitest';
import {
  calculateOTWithShift,
  calculateOTWithoutShift,
  normalizeEndTime,
  overlapMinutes,
  parseTimeToMinutes,
  roundHours
} from './ot';

describe('ot utilities', () => {
  it('parses time and handles overnight end', () => {
    const start = parseTimeToMinutes('22:00');
    const end = normalizeEndTime(start, parseTimeToMinutes('02:00'));
    expect(start).toBe(1320);
    expect(end).toBe(1560);
  });

  it('rounds minutes to hours with 4 decimals', () => {
    expect(roundHours(75)).toBe(1.25);
    expect(roundHours(0)).toBe(0);
  });

  it('calculates overlap minutes correctly', () => {
    expect(overlapMinutes(18 * 60, 21 * 60, 20 * 60, 20 * 60 + 30)).toBe(30);
    expect(overlapMinutes(8 * 60, 9 * 60, 20 * 60, 20 * 60 + 30)).toBe(0);
  });
});

describe('ot calculations', () => {
  it('calculates weekday OT with shift and dinner break deduction', () => {
    const ot = calculateOTWithShift('â€“', 8 * 60, 21 * 60, { start: 8 * 60, end: 17 * 60 });
    expect(ot).toEqual({ o10: 0, o15: 3.5, o20: 0, o30: 0 });
  });

  it('calculates holiday OT with shift', () => {
    const ot = calculateOTWithShift('Holiday', 8 * 60, 21 * 60, { start: 8 * 60, end: 17 * 60 });
    expect(ot).toEqual({ o10: 8, o15: 0, o20: 0, o30: 3.5 });
  });

  it('calculates OT without shift for weekday', () => {
    const ot = calculateOTWithoutShift('â€“', 9 * 60, 21 * 60);
    expect(ot).toEqual({ o10: 0, o15: 2.5, o20: 0, o30: 0 });
  });
});
