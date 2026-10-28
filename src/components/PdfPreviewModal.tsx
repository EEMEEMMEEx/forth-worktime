'use client';
import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Button } from './ui/Primitive';
import { Download, X } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  filename: string;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  filename
}: PdfPreviewModalProps) {
  const { lang } = useStore();
  const dict = dictionaries[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dict.pdfModalTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="glass-card relative flex flex-col w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
              {dict.pdfModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {filename}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="success" onClick={handleDownload} className="text-xs py-2 px-3 sm:px-4">
              <Download className="w-4 h-4" />
              <span>{dict.downloadPdf}</span>
            </Button>
            <button
              onClick={onClose}
              aria-label={dict.closeModal}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Embed */}
        <div className="flex-1 w-full h-full p-2 bg-slate-100 dark:bg-slate-950">
          <iframe
            src={pdfUrl}
            title={dict.pdfModalTitle}
            className="w-full h-full rounded-2xl border-0 shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
