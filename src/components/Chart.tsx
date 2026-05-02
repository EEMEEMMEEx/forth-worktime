'use client';

import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Card } from './ui/Primitive';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function WorkChart() {
    const { lang, data, otInputs } = useStore();
    const { theme } = useTheme();
    const [metric, setMetric] = useState<'net' | 'ot'>('net');
    const dict = dictionaries[lang];

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    const chartData = useMemo(() => {
        const workingDays = data.filter(d => d.netHours > 0 || (otInputs[d.day] && Object.values(otInputs[d.day]).some(v => v > 0)));
        
        if (metric === 'net') {
            return {
                labels: workingDays.map(d => d.day),
                datasets: [
                    {
                        label: dict.tableNetHours,
                        data: workingDays.map(d => d.netHours),
                        backgroundColor: isDark ? 'rgba(129, 140, 248, 0.8)' : 'rgba(79, 70, 229, 0.6)',
                        borderColor: isDark ? 'rgba(129, 140, 248, 1)' : 'rgba(79, 70, 229, 1)',
                        borderWidth: 0,
                        borderRadius: 8,
                    },
                ],
            };
        } else {
            return {
                labels: workingDays.map(d => d.day),
                datasets: [
                    {
                        label: 'OT 1.0',
                        data: workingDays.map(d => otInputs[d.day]?.o10 || 0),
                        backgroundColor: 'rgba(79, 70, 229, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: 'OT 1.5',
                        data: workingDays.map(d => otInputs[d.day]?.o15 || 0),
                        backgroundColor: 'rgba(192, 38, 211, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: 'OT 2.0',
                        data: workingDays.map(d => otInputs[d.day]?.o20 || 0),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: 'OT 3.0',
                        data: workingDays.map(d => otInputs[d.day]?.o30 || 0),
                        backgroundColor: 'rgba(244, 63, 94, 0.7)',
                        borderRadius: 4,
                    },
                ],
            };
        }
    }, [data, otInputs, dict.tableNetHours, isDark, metric]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: metric === 'ot',
                position: 'top' as const,
                labels: { color: textColor, font: { size: 10, weight: 'bold' as const } }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                titleColor: isDark ? '#f1f5f9' : '#1e293b',
                bodyColor: isDark ? '#94a3b8' : '#64748b',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                displayColors: metric === 'ot',
            }
        },
        scales: {
            y: {
                stacked: metric === 'ot',
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: textColor },
                title: { display: true, text: 'Hours', color: textColor }
            },
            x: { 
                stacked: metric === 'ot',
                grid: { display: false },
                ticks: { color: textColor },
                title: { display: true, text: dict.tableDate, color: textColor } 
            }
        }
    };

    if (!data.length) return null;

    return (
        <Card className="no-print h-[400px] flex flex-col group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-100">{dict.chartTitle}</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setMetric('net')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${metric === 'net' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Net
                    </button>
                    <button 
                        onClick={() => setMetric('ot')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${metric === 'ot' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        OT
                    </button>
                </div>
            </div>
            <div className="flex-grow">
                <Bar options={options} data={chartData} />
            </div>
        </Card>
    );
}
