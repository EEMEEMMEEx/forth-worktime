'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Button } from './ui/Primitive';
import { FileText, Loader2 } from 'lucide-react';
import PdfPreviewModal from './PdfPreviewModal';

export default function ExportPdfButton() {
    const { lang, data, otInputs, monthIdx, year, pay } = useStore();
    const dict = dictionaries[lang];
    const [isLoading, setIsLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Clean up Blob URL when component unmounts or new URL is generated
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    const handleGeneratePdf = async () => {
        if (!data.length || monthIdx === null || year === null) return;

        setIsLoading(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { WorktimeReportPDF } = await import('@/lib/pdf-template');

            const blob = await pdf(
                <WorktimeReportPDF
                    data={data}
                    otInputs={otInputs}
                    monthIdx={monthIdx}
                    year={year}
                    pay={pay}
                />
            ).toBlob();

            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }

            const newUrl = URL.createObjectURL(blob);
            setPdfUrl(newUrl);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const filename = `WorkTime_Report_${(monthIdx ?? 0) + 1}_${year ?? new Date().getFullYear()}.pdf`;

    return (
        <>
            <Button
                onClick={handleGeneratePdf}
                variant="secondary"
                disabled={isLoading}
                className="relative"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                ) : (
                    <FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                )}
                {isLoading ? dict.generatingPdf : dict.exportPdfButton}
            </Button>

            <PdfPreviewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                pdfUrl={pdfUrl}
                filename={filename}
            />
        </>
    );
}
