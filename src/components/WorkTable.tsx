'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Card, Badge } from './ui/Primitive';
import { motion } from 'framer-motion';

export default function WorkTable() {
    const { lang, data, otInputs, setOT } = useStore();
    const dict = dictionaries[lang];

    if (!data.length) return null;

    const locale = lang === 'th' ? 'th-TH' : 'en-US';
    const numberFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const shortDayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });

    const getStatusBadge = (status: string) => {
        if (status === 'Weekend') return <Badge variant="warning">{dict.statusWeekend}</Badge>;
        if (status === 'Holiday') return <Badge variant="error">{dict.statusHoliday}</Badge>;
        return <span className="text-slate-300 text-xs font-medium tracking-widest">—</span>;
    };

    return (
        <Card noPadding className="border border-slate-100 dark:border-slate-700 shadow-2xl shadow-indigo-900/5 dark:shadow-black/20 group">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-100 text-lg">{dict.tableHeader || 'Detailed Work Logs'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily breakdown and OT adjustments</p>
                </div>
                <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-500 opacity-50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 dark:bg-fuchsia-500 opacity-50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500 opacity-50" />
                </div>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-left font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">{dict.tableDate}</th>
                            <th className="px-6 py-4 text-left font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">{dict.tableInOut}</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">{dict.tableNetHours}</th>
                            {['OT 1.0', 'OT 1.5', 'OT 2.0', 'OT 3.0'].map(h => (
                                <th key={h} className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">{h}</th>
                            ))}
                            <th className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">{dict.tableStatus}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                        {data.map((d, idx) => {
                            const ot = otInputs[d.day] || {};
                            const dateObj = new Date(d.date.split('.').reverse().join('-'));

                            return (
                                <motion.tr 
                                    key={d.date} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all duration-300 group/row"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight">{d.date.substring(0, 5)}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{shortDayFormat.format(dateObj)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">{d.inOut || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black tabular-nums tracking-tighter ${d.netHours > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700'}`}>
                                            {numberFormat.format(d.netHours)}
                                            <span className="text-[10px] ml-0.5 text-slate-400 dark:text-slate-500">h</span>
                                        </span>
                                    </td>
                                    {(['o10', 'o15', 'o20', 'o30'] as const).map((rate) => (
                                        <td key={rate} className="px-2 py-4 text-center">
                                            <input
                                                type="number"
                                                min="0" max="24" step="0.0001"
                                                value={ot[rate] || ''}
                                                placeholder="0.00"
                                                onChange={(e) => {
                                                    let val = parseFloat(e.target.value);
                                                    if (isNaN(val)) val = 0;
                                                    setOT(d.day, rate, val);
                                                }}
                                                className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-2 text-right font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs group-hover/row:bg-white dark:group-hover/row:bg-slate-800"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-center">{getStatusBadge(d.status)}</td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 font-black text-slate-800 dark:text-slate-100 border-t-2 border-slate-200 dark:border-slate-700">
                            <td colSpan={2} className="px-6 py-5 text-right uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400 sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                {dict.tableSummary || 'Total Summary'}
                            </td>
                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                <span className="text-base tracking-tighter text-indigo-600 dark:text-indigo-400">
                                    {numberFormat.format(data.reduce((sum, d) => sum + d.netHours, 0))}
                                    <span className="text-[10px] ml-0.5 text-slate-400 dark:text-slate-500">h</span>
                                </span>
                            </td>
                            {(['o10', 'o15', 'o20', 'o30'] as const).map((rate) => {
                                const total = Object.values(otInputs).reduce((sum, ot) => sum + (ot[rate] || 0), 0);
                                return (
                                    <td key={rate} className="px-2 py-5 text-center whitespace-nowrap">
                                        <span className="text-sm tracking-tighter tabular-nums dark:text-slate-200">
                                            {total > 0 ? numberFormat.format(total) : '0.00'}
                                            <span className="text-[10px] ml-0.5 text-slate-400 dark:text-slate-500">h</span>
                                        </span>
                                    </td>
                                );
                            })}
                            <td className="px-6 py-5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Card>
    );
}
