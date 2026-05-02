import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

import AuthHandler from '@/components/AuthHandler';
import SyncHandler from '@/components/SyncHandler';
import { ThemeProvider } from '@/components/ThemeProvider';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkTime Analyzer',
  description: 'Monthly Work & OT Report Analyzer',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WorkTime',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthHandler />
          <SyncHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
