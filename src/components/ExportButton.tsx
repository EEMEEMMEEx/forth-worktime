'use client';
import { useStore } from '@/lib/store';
import { dictionaries } from '@/lib/dictionaries';
import { Button } from './ui/Primitive';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExportButton() {
    const { lang, data, otInputs, monthIdx, year } = useStore();
    const dict = dictionaries[lang];

    const handleExport = () => {
        if (!data.length || monthIdx === null) return;

        const headers = [
            dict.tableDate,
            dict.tableInOut,
            dict.tableNetHours,
            "OT 1.0", "OT 1.5", "OT 2.0", "OT 3.0",
            dict.tableStatus
        ];

        const sheetData = data.map(d => {
            const ot = otInputs[d.day] || {};
            return {
                [headers[0]]: d.date,
                [headers[1]]: d.inOut,
                [headers[2]]: d.netHours,
                [headers[3]]: ot.o10 || 0,
                [headers[4]]: ot.o15 || 0,
                [headers[5]]: ot.o20 || 0,
                [headers[6]]: ot.o30 || 0,
                [headers[7]]: d.status
            };
        });

        // Calculate Totals
        const totalNet = data.reduce((sum, d) => sum + d.netHours, 0);
        const totalO10 = data.reduce((sum, d) => sum + (otInputs[d.day]?.o10 || 0), 0);
        const totalO15 = data.reduce((sum, d) => sum + (otInputs[d.day]?.o15 || 0), 0);
        const totalO20 = data.reduce((sum, d) => sum + (otInputs[d.day]?.o20 || 0), 0);
        const totalO30 = data.reduce((sum, d) => sum + (otInputs[d.day]?.o30 || 0), 0);

        sheetData.push({
            [headers[0]]: dict.tableSummary || "Total",
            [headers[1]]: "",
            [headers[2]]: totalNet,
            [headers[3]]: totalO10,
            [headers[4]]: totalO15,
            [headers[5]]: totalO20,
            [headers[6]]: totalO30,
            [headers[7]]: ""
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sheetData);

        // Auto-width
        const wscols = headers.map(() => ({ wch: 15 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Worktime");
        const filename = `Worktime_${String(monthIdx + 1).padStart(2, '0')}_${year}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    if (!data.length) return null;

    return (
        <Button variant="success" onClick={handleExport} className="no-print">
            <Download className="w-5 h-5" />
            {dict.exportButton}
        </Button>
    );
}
