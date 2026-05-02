import { WorkDay } from './types';
import { dictionaries } from './dictionaries';

interface ParseResult {
    results: WorkDay[];
    monthIdx: number;
    year: number;
    otInputs: Record<number, { o10: number, o15: number, o20: number, o30: number }>;
}

export async function analyzePdf(file: File, lang: 'en' | 'th' = 'th'): Promise<ParseResult> {
    // Dynamic import to prevent SSR issues
    const pdfJS = await import('pdfjs-dist');
    // Handle different export structures (default vs named)
    const pdfLib = pdfJS.default || pdfJS;

    if (typeof window !== 'undefined' && pdfLib.GlobalWorkerOptions) {
        pdfLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();

    // Load PDF
    const loadingTask = pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    // Extract Text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        interface TextItem { str: string; }
        fullText += (textContent.items as TextItem[]).map((item) => item.str).join(' ');
    }

    // Slice irrelevant footer text
    const summaryIndex = fullText.lastIndexOf("รวม") > -1 ? fullText.lastIndexOf("รวม") : fullText.lastIndexOf("สรุป");
    const relevantText = summaryIndex > -1 ? fullText.substring(0, summaryIndex) : fullText;
    const normalizedText = relevantText.replace(/\s+/g, ' ');

    // Find Date (Month/Year)
    const dateMatch = normalizedText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) {
        throw new Error(dictionaries[lang].errorNoDate);
    }

    const month = parseInt(dateMatch[2]);
    const year = parseInt(dateMatch[3]);
    const daysInMonth = new Date(year, month, 0).getDate();
    const recordsMap = new Map<string, WorkDay>();
    const otInputs: Record<number, { o10: number, o15: number, o20: number, o30: number }> = {};

    // Initialize all days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${String(d).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
        const dayOfWeek = new Date(year, month - 1, d).getDay();
        recordsMap.set(dateKey, {
            day: d,
            date: dateKey,
            inOut: '–',
            netHours: 0,
            status: (dayOfWeek === 0 || dayOfWeek === 6) ? 'Weekend' : '–',
            dayOfWeek: dayOfWeek
        });
    }

    // Parse segments
    normalizedText.split(/(?=\d{2}\.\d{2}\.\d{4})/g).forEach(segment => {
        const segmentDateMatch = segment.match(/^(\d{2}\.\d{2}\.\d{4})/);
        if (segmentDateMatch) {
            const entry = recordsMap.get(segmentDateMatch[0]);
            if (entry) {
                // Enhanced Holiday Detection
                if (segment.includes('PH') || segment.includes('Holiday') || segment.includes('วันหยุด')) {
                    entry.status = 'Holiday';
                }

                // Ignore shift time periods like "08:00 - 17:00"
                const strippedSegment = segment.replace(/\b([01]?\d|2[0-3]):[0-5]\d\s*-\s*([01]?\d|2[0-3]):[0-5]\d\b/g, '');
                const timestamps = strippedSegment.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
                if (timestamps.length >= 2) {
                    // Utility to parse time to total minutes
                    const parseToMinutes = (t: string) => {
                        const [h, m] = t.split(':').map(Number);
                        return h * 60 + m;
                    };

                    let totalMinutes = 0;
                    const segments: string[] = [];

                    // Process pairs of timestamps
                    for (let i = 0; i < timestamps.length - 1; i += 2) {
                        const timeIn = timestamps[i];
                        const timeOut = timestamps[i + 1];
                        
                        const start = parseToMinutes(timeIn);
                        let end = parseToMinutes(timeOut);
                        if (end < start) end += 1440; // Midnight crossing

                        totalMinutes += (end - start);
                        segments.push(`${timeIn}-${timeOut}`);
                    }

                    // Special Rule: If exactly one pair exists, it might be a full shift.
                    // Deduct 60 mins break if duration > 60 mins (standard lunch break).
                    if (timestamps.length === 2 && totalMinutes > 60) {
                        totalMinutes -= 60;
                    }

                    // Rounding Logic
                    const roundHours = (minutes: number) => {
                        if (minutes <= 0) return 0;
                        return Math.round((minutes / 60) * 10000) / 10000;
                    };

                    const finalHours = roundHours(totalMinutes);
                    entry.inOut = segments.join(', ');
                    entry.netHours = finalHours;

                    // Auto-Calculate OT based ONLY on 'เงินได้' remark
                    const earnMatch = segment.match(/เงินได้\s*\(\s*([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\s*\)/);
                    if (earnMatch) {
                        const remarkIn = parseInt(earnMatch[1]) * 60 + parseInt(earnMatch[2]);
                        let remarkOut = parseInt(earnMatch[3]) * 60 + parseInt(earnMatch[4]);
                        if (remarkOut < remarkIn) remarkOut += 1440;

                        const textWithoutEarn = segment.replace(/เงินได้\s*\(.*?\)/, '');
                        const shiftMatch = textWithoutEarn.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\b/);
                        
                        let hasShift = false;
                        let shiftStart = 0;
                        let shiftEnd = 0;
                        let textForActual = textWithoutEarn;
                        
                        if (shiftMatch) {
                            hasShift = true;
                            shiftStart = parseInt(shiftMatch[1]) * 60 + parseInt(shiftMatch[2]);
                            let e = parseInt(shiftMatch[3]) * 60 + parseInt(shiftMatch[4]);
                            if (e < shiftStart) e += 1440; // Midnight crossing
                            shiftEnd = e;
                            textForActual = textForActual.replace(shiftMatch[0], ''); // Remove shift so we can extract actual in/out
                        }

                        const actualTimes = textForActual.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g) || [];
                        let actualIn = remarkIn;
                        let actualOut = remarkOut;

                        if (actualTimes.length >= 2) {
                            actualIn = parseInt(actualTimes[0]!.split(':')[0]) * 60 + parseInt(actualTimes[0]!.split(':')[1]);
                            let ao = parseInt(actualTimes[actualTimes.length - 1]!.split(':')[0]) * 60 + parseInt(actualTimes[actualTimes.length - 1]!.split(':')[1]);
                            if (ao < actualIn) ao += 1440;
                            actualOut = ao;
                        }

                        // Intersection of Actual In/Out and Remark In/Out
                        const workStart = Math.max(actualIn, remarkIn);
                        const workEnd = Math.min(actualOut, remarkOut);
                        const workDuration = Math.max(0, workEnd - workStart);
                        
                        // Calculate unpaid dinner break (20:00 - 20:30)
                        const dinnerStart = 1200; // 20:00 in minutes
                        const dinnerEnd = 1230;   // 20:30 in minutes
                        const dinnerBreakDuration = Math.max(0, Math.min(workEnd, dinnerEnd) - Math.max(workStart, dinnerStart));

                        const ot = { o10: 0, o15: 0, o20: 0, o30: 0 };

                        if (hasShift) {
                            // Rule B: Split by Shift Boundary
                            const coreStart = Math.max(workStart, shiftStart);
                            const coreEnd = Math.min(workEnd, shiftEnd);
                            let coreMins = Math.max(0, coreEnd - coreStart);
                            
                            if (coreMins >= 300) {
                                coreMins -= 60; // Deduct 1h lunch
                            }
                            
                            const otBefore = Math.max(0, Math.min(workEnd, shiftStart) - workStart);
                            const otAfter = Math.max(0, workEnd - Math.max(workStart, shiftEnd));
                            
                            // The dinner break falls entirely in otAfter
                            const adjustedOtAfter = Math.max(0, otAfter - dinnerBreakDuration);
                            const otMins = otBefore + adjustedOtAfter;

                            if (entry.status === 'Holiday' || entry.status === 'Weekend') {
                                ot.o10 = roundHours(coreMins);
                                ot.o30 = roundHours(otMins);
                            } else {
                                ot.o15 = roundHours(otMins);
                            }
                        } else {
                            // Rule A: No Shift Listed, Continuous Block
                            let coreMins = workDuration;
                            
                            if (coreMins >= 300) {
                                coreMins -= 60; // Deduct 1h lunch
                            }
                            if (dinnerBreakDuration > 0) {
                                coreMins -= dinnerBreakDuration; // Deduct dinner break if applicable
                            }

                            let otMins = 0;
                            if (coreMins > 480) { // Cap core at 8 hours
                                otMins = coreMins - 480;
                                coreMins = 480;
                            }

                            if (entry.status === 'Holiday' || entry.status === 'Weekend') {
                                ot.o10 = roundHours(coreMins);
                                ot.o30 = roundHours(otMins);
                            } else {
                                ot.o15 = roundHours(otMins);
                            }
                        }

                        if (ot.o10 > 0 || ot.o15 > 0 || ot.o20 > 0 || ot.o30 > 0) {
                            otInputs[entry.day] = ot;
                        }
                    }
                }
            }
        }
    });

    return { results: Array.from(recordsMap.values()), monthIdx: month - 1, year: year, otInputs };
}
