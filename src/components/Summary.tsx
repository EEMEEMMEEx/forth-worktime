'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Card, Badge } from './ui/Primitive';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

export function OtSummary() {
    const { lang, data, otInputs } = useStore();
    const dict = dictionaries[lang];

    const totals = useMemo(() => {
        const t = { o10: 0, o15: 0, o20: 0, o30: 0 };
        Object.values(otInputs).forEach(day => {
            t.o10 += day.o10 || 0;
            t.o15 += day.o15 || 0;
            t.o20 += day.o20 || 0;
            t.o30 += day.o30 || 0;
        });
        return t;
    }, [otInputs]);

    if (!data.length) return null;

    const rates = [
        { key: 'o10', label: 'OT 1.0', color: 'bg-indigo-500/10 text-indigo-700' },
        { key: 'o15', label: 'OT 1.5', color: 'bg-fuchsia-500/10 text-fuchsia-700' },
        { key: 'o20', label: 'OT 2.0', color: 'bg-emerald-500/10 text-emerald-700' },
        { key: 'o30', label: 'OT 3.0', color: 'bg-rose-500/10 text-rose-700' },
    ] as const;

    return (
        <Card className="h-full flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="flex items-center justify-between mb-6 relative">
                <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-100">{dict.otSummaryTitle}</h3>
                <Badge variant="indigo">Overview</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-grow relative">
                {rates.map((rate, i) => (
                    <motion.div 
                        key={rate.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 p-4 flex flex-col items-center justify-center text-center shadow-sm backdrop-blur-sm group-hover:bg-white/60 dark:group-hover:bg-slate-700/60 transition-colors"
                    >
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full ${rate.color} dark:bg-opacity-20`}>
                            {rate.label}
                        </div>
                        <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100 tracking-tighter">
                            {totals[rate.key] % 1 === 0 ? totals[rate.key] : Number(totals[rate.key].toFixed(4))}
                            <span className="text-[10px] ml-0.5 text-slate-400 dark:text-slate-500">h</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
}

export function PayCalculator() {
    const { lang, data, otInputs, pay, setPay } = useStore();
    const dict = dictionaries[lang];

    const totals = useMemo(() => {
        const t = { o10: 0, o15: 0, o20: 0, o30: 0 };
        Object.values(otInputs).forEach(day => {
            t.o10 += day.o10 || 0;
            t.o15 += day.o15 || 0;
            t.o20 += day.o20 || 0;
            t.o30 += day.o30 || 0;
        });
        return t;
    }, [otInputs]);

    const effectiveRate = pay.baseHours > 0 ? pay.monthlySalary / pay.baseHours : 0;
    const payout = {
        p10: totals.o10 * 1.0 * effectiveRate,
        p15: totals.o15 * 1.5 * effectiveRate,
        p20: totals.o20 * 2.0 * effectiveRate,
        p30: totals.o30 * 3.0 * effectiveRate,
    };
    const totalPay = Object.values(payout).reduce((a, b) => a + b, 0);

    if (!data.length) return null;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(val);

    return (
        <Card className="h-full relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-3xl -mb-16 -mr-16" />
            <div className="flex items-center justify-between mb-8 relative">
                <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-100">{dict.payCalcTitle}</h3>
                <Badge variant="success">Calculated</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block group">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">{dict.monthlySalaryLabel}</span>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">฿</span>
                                <input
                                    type="number"
                                    value={pay.monthlySalary || ''}
                                    placeholder="30000"
                                    onChange={(e) => setPay({ monthlySalary: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-10 pr-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all backdrop-blur-sm"
                                />
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">{dict.baseHoursLabel}</span>
                            <input
                                type="number"
                                value={pay.baseHours}
                                onChange={(e) => setPay({ baseHours: Math.max(1, parseFloat(e.target.value) || 1) })}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all backdrop-blur-sm"
                            />
                        </label>
                    </div>

                    <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-800/30 flex flex-col items-center sm:items-start transition-colors">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">{dict.effectiveRateLabel}</span>
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">฿ {formatCurrency(effectiveRate)}<span className="text-xs ml-1 font-bold text-indigo-400 dark:text-indigo-500/60">/hr</span></div>
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.entries(payout).map(([k, val], i) => (
                            <motion.div 
                                key={k} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                                    OT {k.substring(1).replace(/(\d)(\d)/, '$1.$2')}
                                </div>
                                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">฿ {formatCurrency(val)}</div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <div className="mt-auto p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-xl shadow-emerald-200/50 dark:shadow-none flex justify-between items-center hover:scale-[1.02] transition-transform duration-500 cursor-default group/payout">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{dict.totalOtPayLabel}</div>
                            <div className="text-2xl font-black tracking-tighter">฿ {formatCurrency(totalPay)}</div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover/payout:rotate-12 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
