import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzePdf } from './parser';

describe('parser smoke', () => {
  const samplePath = path.resolve(process.cwd(), 'TIMESTATEMENT_20260502.pdf');
  it.skipIf(!existsSync(samplePath))(
    'parses a real monthly PDF and returns usable summary data',
    async () => {
    const fileBuffer = await readFile(samplePath);
    const file = new File([fileBuffer], 'TIMESTATEMENT_20260502.pdf', {
      type: 'application/pdf'
    });

    const result = await analyzePdf(file, 'en');

    expect(result.year).toBeGreaterThanOrEqual(2020);
    expect(result.monthIdx).toBeGreaterThanOrEqual(0);
    expect(result.monthIdx).toBeLessThanOrEqual(11);
    expect(result.results.length).toBeGreaterThanOrEqual(28);
    expect(result.results.length).toBeLessThanOrEqual(31);
    expect(result.results.some((d) => d.netHours > 0)).toBe(true);
    expect(typeof result.otInputs).toBe('object');
    },
    30000
  );
});
