export interface WorkDay {
  day: number;
  date: string;
  inOut: string;
  netHours: number;
  status: 'Weekend' | 'Holiday' | '–' | 'â€“';
  dayOfWeek: number;
}

export interface OTData {
  o10: number;
  o15: number;
  o20: number;
  o30: number;
}

export interface PaySettings {
  monthlySalary: number;
  baseHours: number;
}

export type Language = 'en' | 'th';

export type OTInputMap = Record<number, OTData>;
