'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { analyzePdf } from '@/lib/parser';
import { Card } from '@/components/ui/Primitive';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function FileUploader() {
    const { lang, busy, setBusy, setData } = useStore();
    const dict = dictionaries[lang];
    const [error, setError] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string>(dict.uploaderFilename);

    const handleFile = async (file: File) => {
        setSelectedName(file.name || dict.uploaderFilename);
        const isPdfByMime = file.type === 'application/pdf';
        const isPdfByName = file.name.toLowerCase().endsWith('.pdf');
        if (!isPdfByMime && !isPdfByName) {
            setError(dict.errorInvalidFileType);
            return;
        }

        setBusy(true);
        setError(null);
        try {
            const { results, monthIdx, year, otInputs } = await analyzePdf(file, lang);
            setData(results, monthIdx, year, otInputs);

            // Reset logic implicitly handled by store or component remount
            // We might want to clear previous OT inputs here if needed
            // useStore.getState().resetOT(); // Implementation dependent

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            setData([], 0, 0);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="no-print hover:shadow-indigo-200/50 hover:shadow-2xl">
            <label className="relative cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-violet-500/30 rounded-xl hover:bg-violet-50 transition-all group">
                <div className={busy ? 'hidden' : 'text-center'}>
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    <span className="mt-2 block text-sm font-semibold text-violet-600 group-hover:scale-105 transition-transform">
                        {dict.uploaderText}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{selectedName}</p>
                </div>

                {busy && (
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 text-violet-500 animate-spin" />
                        <p className="mt-2 text-sm text-slate-600">{dict.loaderText}</p>
                    </div>
                )}

                <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
            </label>
            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                    {dict.errorPrefix} {error}
                </div>
            )}
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 dark:bg-slate-900/40 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{dict.uploaderHint}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dict.uploaderLimitation}</p>
            </div>
        </Card>
    );
}
