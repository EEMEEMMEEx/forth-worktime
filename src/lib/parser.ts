import { WorkDay } from './types';
import { dictionaries } from './dictionaries';

interface ParseResult {
    results: WorkDay[];
    monthIdx: number;
    year: number;
}

export async function analyzePdf(file: File, lang: 'en' | 'th' = 'th'): Promise<ParseResult> {
    // Dynamic import to prevent SSR issues
    const pdfJS = await import('pdfjs-dist');
    // Handle different export structures (default vs named)
    const pdfLib = pdfJS.default || pdfJS;
    const { getDocument, GlobalWorkerOptions } = pdfLib;

    if (typeof window !== 'undefined' && GlobalWorkerOptions) {
        GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();

    // Load PDF
    const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
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
                if (segment.includes('PH')) entry.status = 'Holiday';

                const timestamps = segment.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
                if (timestamps.length >= 2) {
                    const timeIn = timestamps[timestamps.length - 2];
                    const timeOut = timestamps[timestamps.length - 1];

                    // Logic
                    const parseToMinutes = (t: string) => {
                        const [h, m] = t.split(':').map(Number);
                        return h * 60 + m;
                    };

                    const startMinutes = parseToMinutes(timeIn);
                    let endMinutes = parseToMinutes(timeOut);

                    if (endMinutes < startMinutes) endMinutes += 1440; // Over midnight

                    const diffMinutes = endMinutes - startMinutes;
                    // Deduct 60 mins break if > 60
                    const netMinutes = diffMinutes > 60 ? diffMinutes - 60 : 0;

                    // Rounding Logic
                    const roundHours = (minutes: number) => {
                        if (minutes <= 0) return 0;
                        const hours = minutes / 60;
                        const integerPart = Math.floor(hours);
                        const fractionalPart = hours - integerPart;
                        return fractionalPart > 0.3 ? integerPart + 0.5 : integerPart;
                    };

                    entry.inOut = `${timeIn} - ${timeOut}`;
                    entry.netHours = roundHours(netMinutes);
                }
            }
        }
    });

    return { results: Array.from(recordsMap.values()), monthIdx: month - 1, year: year };
}
