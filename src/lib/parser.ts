import { WorkDay } from './types';
import { dictionaries } from './dictionaries';
import {
  calculateOTWithShift,
  calculateOTWithoutShift,
  normalizeEndTime,
  parseTimeToMinutes,
  roundHours
} from './ot';

interface ParseResult {
  results: WorkDay[];
  monthIdx: number;
  year: number;
  otInputs: Record<number, { o10: number; o15: number; o20: number; o30: number }>;
}

interface PdfTextItem {
  str: string;
}

interface PdfPageLike {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
}

interface PdfDocumentLike {
  numPages: number;
  getPage(page: number): Promise<PdfPageLike>;
}

interface PdfLoadingTaskLike {
  promise: Promise<PdfDocumentLike>;
}

interface PdfLibLike {
  version?: string;
  GlobalWorkerOptions?: { workerSrc: string };
  getDocument(input: { data: Uint8Array }): PdfLoadingTaskLike;
}

type PdfModuleLike = PdfLibLike & { default?: PdfLibLike };

const DASH = '–';
const SUMMARY_KEYWORDS = ['รวม', 'สรุป', 'à¸£à¸§à¸¡', 'à¸ªà¸£à¸¸à¸›'];
const HOLIDAY_KEYWORDS = ['PH', 'Holiday', 'วันหยุด', 'à¸§à¸±à¸™à¸«à¸¢à¸¸à¸”'];
const EARN_LABEL_PATTERN = '(?:เงินได้|à¹€à¸‡à¸´à¸™à¹„à¸”à¹‰)';

function findLastKeywordIndex(text: string, keywords: string[]): number {
  return Math.max(...keywords.map((keyword) => text.lastIndexOf(keyword)));
}

export async function analyzePdf(file: File, lang: 'en' | 'th' = 'th'): Promise<ParseResult> {
  const pdfJS =
    typeof window !== 'undefined'
      ? await import('pdfjs-dist')
      : await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfModule = pdfJS as unknown as PdfModuleLike;
  const pdfLib = pdfModule.default || pdfModule;

  if (typeof window !== 'undefined' && pdfLib.GlobalWorkerOptions) {
    pdfLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfLib.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item) => item.str).join(' ');
  }

  const summaryIndex = findLastKeywordIndex(fullText, SUMMARY_KEYWORDS);
  const relevantText = summaryIndex > -1 ? fullText.substring(0, summaryIndex) : fullText;
  const normalizedText = relevantText.replace(/\s+/g, ' ');

  const dateMatch = normalizedText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!dateMatch) {
    throw new Error(dictionaries[lang].errorNoDate);
  }

  const month = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  const recordsMap = new Map<string, WorkDay>();
  const otInputs: Record<number, { o10: number; o15: number; o20: number; o30: number }> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${String(d).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    recordsMap.set(dateKey, {
      day: d,
      date: dateKey,
      inOut: DASH,
      netHours: 0,
      status: dayOfWeek === 0 || dayOfWeek === 6 ? 'Weekend' : DASH,
      dayOfWeek
    });
  }

  normalizedText.split(/(?=\d{2}\.\d{2}\.\d{4})/g).forEach((segment) => {
    const segmentDateMatch = segment.match(/^(\d{2}\.\d{2}\.\d{4})/);
    if (!segmentDateMatch) return;

    const entry = recordsMap.get(segmentDateMatch[0]);
    if (!entry) return;

    if (HOLIDAY_KEYWORDS.some((keyword) => segment.includes(keyword))) {
      entry.status = 'Holiday';
    }

    const strippedSegment = segment.replace(
      /\b([01]?\d|2[0-3]):[0-5]\d\s*-\s*([01]?\d|2[0-3]):[0-5]\d\b/g,
      ''
    );
    const timestamps = strippedSegment.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
    if (timestamps.length < 2) return;

    let totalMinutes = 0;
    const inOutSegments: string[] = [];

    for (let i = 0; i < timestamps.length - 1; i += 2) {
      const timeIn = timestamps[i];
      const timeOut = timestamps[i + 1];
      const start = parseTimeToMinutes(timeIn);
      const end = normalizeEndTime(start, parseTimeToMinutes(timeOut));
      totalMinutes += end - start;
      inOutSegments.push(`${timeIn}-${timeOut}`);
    }

    if (timestamps.length === 2 && totalMinutes > 60) {
      totalMinutes -= 60;
    }

    entry.inOut = inOutSegments.join(', ');
    entry.netHours = roundHours(totalMinutes);

    const earnRegex = new RegExp(
      `${EARN_LABEL_PATTERN}\\s*\\(\\s*([01]?\\d|2[0-3]):([0-5]\\d)\\s*-\\s*([01]?\\d|2[0-3]):([0-5]\\d)\\s*\\)`
    );
    const earnMatch = segment.match(earnRegex);
    if (!earnMatch) return;

    const remarkIn = parseInt(earnMatch[1], 10) * 60 + parseInt(earnMatch[2], 10);
    const remarkOut = normalizeEndTime(
      remarkIn,
      parseInt(earnMatch[3], 10) * 60 + parseInt(earnMatch[4], 10)
    );

    const textWithoutEarn = segment.replace(new RegExp(`${EARN_LABEL_PATTERN}\\s*\\(.*?\\)`), '');
    const shiftMatch = textWithoutEarn.match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\b/
    );

    let hasShift = false;
    let shiftStart = 0;
    let shiftEnd = 0;
    let textForActual = textWithoutEarn;

    if (shiftMatch) {
      hasShift = true;
      shiftStart = parseInt(shiftMatch[1], 10) * 60 + parseInt(shiftMatch[2], 10);
      shiftEnd = normalizeEndTime(
        shiftStart,
        parseInt(shiftMatch[3], 10) * 60 + parseInt(shiftMatch[4], 10)
      );
      textForActual = textForActual.replace(shiftMatch[0], '');
    }

    const actualTimes = textForActual.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g) || [];
    let actualIn = remarkIn;
    let actualOut = remarkOut;

    if (actualTimes.length >= 2) {
      actualIn = parseTimeToMinutes(actualTimes[0]!);
      actualOut = normalizeEndTime(actualIn, parseTimeToMinutes(actualTimes[actualTimes.length - 1]!));
    }

    const workStart = Math.max(actualIn, remarkIn);
    const workEnd = Math.min(actualOut, remarkOut);
    const ot = hasShift
      ? calculateOTWithShift(entry.status, workStart, workEnd, { start: shiftStart, end: shiftEnd })
      : calculateOTWithoutShift(entry.status, workStart, workEnd);

    if (ot.o10 > 0 || ot.o15 > 0 || ot.o20 > 0 || ot.o30 > 0) {
      otInputs[entry.day] = ot;
    }
  });

  return { results: Array.from(recordsMap.values()), monthIdx: month - 1, year, otInputs };
}
