'use client';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, className, noPadding = false, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
                "glass-card rounded-3xl overflow-hidden bento-item",
                !noPadding && "p-4 sm:p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function Button({
    children,
    variant = 'primary',
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'success' | 'outline' }) {

    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-500 dark:to-fuchsia-500 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/20 hover:shadow-indigo-300/60 hover:scale-[1.02]",
        secondary: "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-white/20 dark:border-slate-700/30",
        success: "bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20 hover:shadow-emerald-300/60 hover:scale-[1.02]",
        outline: "border border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
    };

    return (
        <button
            className={cn(
                "px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 text-sm",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function Badge({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'error' | 'indigo' }) {
    const variants = {
        default: "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400",
        success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
        warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        error: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
        indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
    };
    
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
            {children}
        </span>
    );
}
