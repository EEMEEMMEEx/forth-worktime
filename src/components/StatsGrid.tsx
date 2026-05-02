'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { useMemo } from 'react';

export default function StatsGrid() {
    const { lang, data } = useStore();
    const dict = dictionaries[lang];

    const stats = useMemo(() => {
        if (!data.length) return null;
        
        const workDays = data.filter(d => d.netHours > 0);
        const totalNetHours = workDays.reduce((acc, d) => acc + d.netHours, 0);
        const avgHours = workDays.length > 0 ? totalNetHours / workDays.length : 0;
        const maxDay = Math.max(...data.map(d => d.netHours));

        return [
            {
                label: dict.statsTotalDays,
                value: workDays.length,
                suffix: ' days',
                icon: <Calendar className="w-5 h-5 text-indigo-500" />,
                color: 'from-indigo-500/10 to-indigo-500/5',
                borderColor: 'border-indigo-500/20'
            },
            {
                label: dict.statsTotalHours,
                value: totalNetHours.toFixed(1),
                suffix: ' hrs',
                icon: <Clock className="w-5 h-5 text-fuchsia-500" />,
                color: 'from-fuchsia-500/10 to-fuchsia-500/5',
                borderColor: 'border-fuchsia-500/20'
            },
            {
                label: dict.statsAvgHours,
                value: avgHours.toFixed(2),
                suffix: ' h/d',
                icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
                color: 'from-emerald-500/10 to-emerald-500/5',
                borderColor: 'border-emerald-500/20'
            },
            {
                label: dict.statsMaxHours,
                value: maxDay.toFixed(1),
                suffix: ' hrs',
                icon: <BarChart2 className="w-5 h-5 text-rose-500" />,
                color: 'from-rose-500/10 to-rose-500/5',
                borderColor: 'border-rose-500/20'
            }
        ];
    }, [data, dict]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative overflow-hidden rounded-3xl border ${stat.borderColor} bg-gradient-to-br ${stat.color} p-5 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 shadow-sm group-hover:scale-110 transition-transform">
                            {stat.icon}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Metric {i + 1}
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums">
                            {stat.value}
                            <span className="text-xs ml-1 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{stat.suffix}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 dark:bg-slate-400/5 rounded-full blur-2xl group-hover:bg-white/20 dark:group-hover:bg-slate-400/10 transition-colors" />
                </motion.div>
            ))}
        </div>
    );
}
