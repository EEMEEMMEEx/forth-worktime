import { OTData, WorkDay } from './types';

export interface ShiftWindow {
  start: number;
  end: number;
}

export const DINNER_BREAK_START = 20 * 60; // 20:00
export const DINNER_BREAK_END = 20 * 60 + 30; // 20:30

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function normalizeEndTime(start: number, end: number): number {
  return end < start ? end + 1440 : end;
}

export function roundHours(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 10000) / 10000;
}

export function overlapMinutes(startA: number, endA: number, startB: number, endB: number): number {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

export function calculateOTWithShift(
  status: WorkDay['status'],
  workStart: number,
  workEnd: number,
  shift: ShiftWindow
): OTData {
  const ot: OTData = { o10: 0, o15: 0, o20: 0, o30: 0 };

  const coreStart = Math.max(workStart, shift.start);
  const coreEnd = Math.min(workEnd, shift.end);
  let coreMins = Math.max(0, coreEnd - coreStart);
  if (coreMins >= 300) coreMins -= 60; // lunch

  const otBefore = Math.max(0, Math.min(workEnd, shift.start) - workStart);
  const otAfter = Math.max(0, workEnd - Math.max(workStart, shift.end));
  const dinnerBreak = overlapMinutes(workStart, workEnd, DINNER_BREAK_START, DINNER_BREAK_END);
  const adjustedOtAfter = Math.max(0, otAfter - dinnerBreak);
  const otMins = otBefore + adjustedOtAfter;

  if (status === 'Holiday' || status === 'Weekend') {
    ot.o10 = roundHours(coreMins);
    ot.o30 = roundHours(otMins);
  } else {
    ot.o15 = roundHours(otMins);
  }

  return ot;
}

export function calculateOTWithoutShift(
  status: WorkDay['status'],
  workStart: number,
  workEnd: number
): OTData {
  const ot: OTData = { o10: 0, o15: 0, o20: 0, o30: 0 };
  let coreMins = Math.max(0, workEnd - workStart);

  if (coreMins >= 300) coreMins -= 60; // lunch
  const dinnerBreak = overlapMinutes(workStart, workEnd, DINNER_BREAK_START, DINNER_BREAK_END);
  if (dinnerBreak > 0) coreMins -= dinnerBreak;

  let otMins = 0;
  if (coreMins > 480) {
    otMins = coreMins - 480;
    coreMins = 480;
  }

  if (status === 'Holiday' || status === 'Weekend') {
    ot.o10 = roundHours(coreMins);
    ot.o30 = roundHours(otMins);
  } else {
    ot.o15 = roundHours(otMins);
  }

  return ot;
}
