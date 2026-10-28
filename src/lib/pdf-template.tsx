import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { WorkDay, OTInputMap, PaySettings } from './types';

// Register THSarabunNew Thai fonts
Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: '/fonts/THSarabunNew.ttf' },
    { src: '/fonts/THSarabunNew Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/THSarabunNew Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/THSarabunNew BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'THSarabunNew',
    padding: '10mm 15mm 15mm 15mm',
    fontSize: 10,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    paddingBottom: 6,
    marginBottom: 8
  },
  companyTh: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  companyEn: {
    fontSize: 8,
    color: '#64748b'
  },
  reportBadge: {
    fontSize: 8,
    color: '#4338ca',
    backgroundColor: '#e0e7ff',
    padding: '2 6',
    borderRadius: 4,
    fontWeight: 'bold'
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 8
  },
  
  // KPI Summary Card
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  kpiItem: {
    fontSize: 9.5
  },
  kpiBold: {
    fontWeight: 'bold',
    color: '#312e81'
  },
  kpiHighlight: {
    fontWeight: 'bold',
    color: '#059669'
  },

  // Work Table Grid
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    marginBottom: 8
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
    minHeight: 12,
    alignItems: 'center'
  },
  tableHeaderRow: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableFooterRow: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderColor: '#94a3b8',
    fontWeight: 'bold'
  },
  
  // Columns
  colDate: { width: '13%', textAlign: 'center', borderRightWidth: 0.5, borderColor: '#cbd5e1', padding: '1 2' },
  colInOut: { width: '23%', textAlign: 'center', borderRightWidth: 0.5, borderColor: '#cbd5e1', padding: '1 2' },
  colNet: { width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderColor: '#cbd5e1', padding: '1 4' },
  colOT: { width: '10%', textAlign: 'center', borderRightWidth: 0.5, borderColor: '#cbd5e1', padding: '1 2' },
  colStatus: { width: '12%', textAlign: 'center', padding: '1 2' },

  weekendRow: {
    backgroundColor: '#fafafa'
  }
});

interface WorktimeReportPdfProps {
  data: WorkDay[];
  otInputs: OTInputMap;
  monthIdx: number;
  year: number;
  pay: PaySettings;
}

export const WorktimeReportPDF: React.FC<WorktimeReportPdfProps> = ({
  data,
  otInputs,
  monthIdx,
  year,
  pay
}) => {
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthTitle = `${monthNames[monthIdx] || ''} ${year + 543}`;
  
  const totalNet = data.reduce((sum, d) => sum + d.netHours, 0);
  const workDaysCount = data.filter((d) => d.netHours > 0).length;

  const totals = { o10: 0, o15: 0, o20: 0, o30: 0 };
  Object.values(otInputs).forEach((day) => {
    totals.o10 += day.o10 || 0;
    totals.o15 += day.o15 || 0;
    totals.o20 += day.o20 || 0;
    totals.o30 += day.o30 || 0;
  });

  const effectiveRate = pay.baseHours > 0 ? pay.monthlySalary / pay.baseHours : 0;
  const totalPay = (totals.o10 * 1.0 + totals.o15 * 1.5 + totals.o20 * 2.0 + totals.o30 * 3.0) * effectiveRate;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={styles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
          </View>
          <Text style={styles.reportBadge}>Official Monthly Statement</Text>
        </View>

        <Text style={styles.docTitle}>ใบสรุปเวลาทำงานและค่าตอบแทนล่วงเวลา (OT)</Text>

        <View style={styles.metaRow}>
          <Text>ประจำงวดเดือน: <Text style={{ fontWeight: 'bold' }}>{monthTitle}</Text></Text>
          <Text>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH')}</Text>
        </View>

        {/* KPI Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiItem}>วันทำงานจริง: <Text style={styles.kpiBold}>{workDaysCount} วัน</Text></Text>
            <Text style={styles.kpiItem}>ชม. สุทธิรวม: <Text style={styles.kpiBold}>{totalNet.toFixed(2)} ชม.</Text></Text>
            <Text style={styles.kpiItem}>เงินเดือนฐาน: <Text style={styles.kpiBold}>฿{pay.monthlySalary.toLocaleString()}</Text></Text>
            <Text style={styles.kpiItem}>รวมค่าแรง OT สุทธิ: <Text style={styles.kpiHighlight}>฿{totalPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Text>
          </View>
        </View>

        {/* Detailed Work Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.colDate}>วันที่</Text>
            <Text style={styles.colInOut}>เวลาเข้า-ออก</Text>
            <Text style={styles.colNet}>ชม.(สุทธิ)</Text>
            <Text style={styles.colOT}>OT 1.0</Text>
            <Text style={styles.colOT}>OT 1.5</Text>
            <Text style={styles.colOT}>OT 2.0</Text>
            <Text style={styles.colOT}>OT 3.0</Text>
            <Text style={styles.colStatus}>สถานะ</Text>
          </View>

          {data.map((row) => {
            const ot = otInputs[row.day] || { o10: 0, o15: 0, o20: 0, o30: 0 };
            const isWeekend = row.status === 'Weekend';
            return (
              <View key={row.day} style={[styles.tableRow, isWeekend ? styles.weekendRow : {}]}>
                <Text style={styles.colDate}>{row.date.substring(0, 5)}</Text>
                <Text style={styles.colInOut}>{row.inOut}</Text>
                <Text style={styles.colNet}>{row.netHours > 0 ? row.netHours.toFixed(2) : '-'}</Text>
                <Text style={styles.colOT}>{ot.o10 > 0 ? ot.o10.toFixed(1) : '-'}</Text>
                <Text style={styles.colOT}>{ot.o15 > 0 ? ot.o15.toFixed(1) : '-'}</Text>
                <Text style={styles.colOT}>{ot.o20 > 0 ? ot.o20.toFixed(1) : '-'}</Text>
                <Text style={styles.colOT}>{ot.o30 > 0 ? ot.o30.toFixed(1) : '-'}</Text>
                <Text style={styles.colStatus}>{row.status === '–' || row.status === 'â€“' ? '-' : row.status}</Text>
              </View>
            );
          })}

          {/* Table Totals Row */}
          <View style={[styles.tableRow, styles.tableFooterRow]}>
            <Text style={styles.colDate}>สรุปยอดรวม</Text>
            <Text style={styles.colInOut}>-</Text>
            <Text style={styles.colNet}>{totalNet.toFixed(2)}</Text>
            <Text style={styles.colOT}>{totals.o10 > 0 ? totals.o10.toFixed(1) : '-'}</Text>
            <Text style={styles.colOT}>{totals.o15 > 0 ? totals.o15.toFixed(1) : '-'}</Text>
            <Text style={styles.colOT}>{totals.o20 > 0 ? totals.o20.toFixed(1) : '-'}</Text>
            <Text style={styles.colOT}>{totals.o30 > 0 ? totals.o30.toFixed(1) : '-'}</Text>
            <Text style={styles.colStatus}>-</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
