'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Button } from './ui/Primitive';
import { Printer, Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import ExportButton from './ExportButton';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const { lang, setLang, data, busy, syncing, uid, syncError } = useStore();
    const dict = dictionaries[lang];

    const handlePrint = () => {
        window.print();
    };

    return (
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 no-print mb-10">
            <div className="w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{dict.appTitle}</h1>
                    {data.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 text-slate-400 backdrop-blur-sm">
                            {!uid ? (
                                <><CloudOff className="w-3 h-3 text-rose-500" /> <span className="hidden xs:inline">Offline</span></>
                            ) : syncError ? (
                                <><AlertTriangle className="w-3 h-3 text-amber-500" /> <span className="hidden xs:inline">Sync Error</span></>
                            ) : syncing ? (
                                <><RefreshCw className="w-3 h-3 animate-spin text-indigo-500" /> <span className="hidden xs:inline">Syncing</span></>
                            ) : (
                                <><Cloud className="w-3 h-3 text-emerald-500" /> <span className="hidden xs:inline">Synced</span></>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{dict.appSubtitle}</p>
                {syncError && (
                    <p className="text-amber-600 dark:text-amber-400 mt-2 text-xs font-semibold">{syncError}</p>
                )}
            </div>

            <div className="flex flex-row-reverse sm:flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                {/* Actions (Only visible if data loaded) */}
                {!busy && data.length > 0 && (
                    <div className="flex gap-2">
                        <ExportButton />
                        <Button onClick={handlePrint}>
                            <Printer className="w-5 h-5" />
                            {dict.printButton}
                        </Button>
                    </div>
                )}

                {/* Language & Theme Switcher */}
                <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 p-1 rounded-2xl border border-white/20 dark:border-slate-700/50 backdrop-blur-sm">
                    <ThemeToggle />
                    
                    <button
                        onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                        className="px-4 py-2 rounded-xl text-xs font-black hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all text-slate-600 dark:text-slate-300 active:scale-95"
                    >
                        {lang.toUpperCase()}
                    </button>
                </div>
            </div>
        </header>
    );
}
