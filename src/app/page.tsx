'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import WorkTable from '@/components/WorkTable';
import { OtSummary, PayCalculator } from '@/components/Summary';
import WorkChart from '@/components/Chart';
import StatsGrid from '@/components/StatsGrid';
import { Card } from '@/components/ui/Primitive';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { lang, data, monthIdx, year, otInputs } = useStore();
  const dict = dictionaries[lang];
  const holidayDays = data.filter((d) => d.status === 'Holiday').length;
  const weekendDays = data.filter((d) => d.status === 'Weekend').length;
  const otDays = Object.values(otInputs).filter((ot) => (ot.o10 + ot.o15 + ot.o20 + ot.o30) > 0).length;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 min-h-screen pb-20 selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-200 transition-colors duration-500">
      {/* Print Header */}
      <div className="hidden print:block border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">WorkTime Analyzer - Monthly Report</h1>
          <p className="text-sm text-slate-500 font-medium">
            {new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}
          </p>
        </div>
      </div>

      <Header />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <FileUploader />
      </motion.div>

      <AnimatePresence mode="wait">
        {data.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Analytics Dashboard */}
            <StatsGrid />
            <Card className="p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                {dict.dataSourceTitle}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-[11px] text-slate-500">{dict.dataSourceMonth}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {monthIdx !== null && year ? new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', year: 'numeric' }).format(new Date(year, monthIdx)) : '-'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-[11px] text-slate-500">{dict.dataSourceHolidayDays}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{holidayDays}</div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-[11px] text-slate-500">{dict.dataSourceWeekendDays}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{weekendDays}</div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-[11px] text-slate-500">{dict.dataSourceOtDays}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{otDays}</div>
                </div>
              </div>
            </Card>

            {/* Bento Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-auto">
              
              {/* Report Month & Total Hours - Main Big Card */}
              <Card className="lg:col-span-8 flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-400/10 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-fuchsia-500/5 dark:bg-fuchsia-400/5 rounded-full blur-3xl group-hover:bg-fuchsia-500/10 dark:group-hover:bg-fuchsia-400/10 transition-colors duration-500" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">{dict.reportMonthHeader}</div>
                    <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      {monthIdx !== null && year ? new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(year, monthIdx)) : '—'}
                    </div>
                  </div>
                  <div className="md:text-right bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{dict.totalNetHoursHeader}</div>
                    <div className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                      {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(data.reduce((sum, d) => sum + d.netHours, 0))}
                      <span className="text-xl font-bold text-slate-400 dark:text-slate-500 ml-2">hrs</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* OT Summary Grid - Smaller Cards in Bento */}
              <div className="lg:col-span-4 h-full">
                <OtSummary />
              </div>

              {/* Pay Calculator - Large Side Card */}
              <div className="lg:col-span-7">
                <PayCalculator />
              </div>

              {/* Summary Chart - Complementary Card */}
              <div className="lg:col-span-5 h-full">
                <WorkChart />
              </div>

              {/* Full Width Table */}
              <div className="lg:col-span-12 mt-4">
                <WorkTable />
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 mt-20 no-print pb-10 transition-colors duration-500">
        <p className="tracking-wide">{dict.footerText}</p>
        <p className="mt-2 opacity-50 flex items-center justify-center gap-1">
          Designed for Productivity <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" /> Powered by Next.js & Firebase
        </p>
      </footer>
    </main>
  );
}
