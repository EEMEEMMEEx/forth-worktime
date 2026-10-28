# PDF Generator Architecture (Dual-Engine: Go Standalone & Next.js)

## ภาพรวม (Overview)
ระบบสร้างเอกสาร PDF สรุปเวลาทำงานและค่าตอบแทนล่วงเวลา (Monthly WorkTime & OT Report) ในรูปแบบขนาด A4 ทางการ ออกแบบให้รองรับการทำงานทั้งสองโหมด:
1. **Go Standalone (`./worktime.exe`)**: สร้าง PDF ฝั่งเซิร์ฟเวอร์แบบ Pure Go ด้วย `github.com/signintech/gopdf` พร้อมฝังฟอนต์ไทย `THSarabunNew` และ `THSarabunNew-Bold` ลงในไบนารีเดียว (Single Binary) ผ่าน `//go:embed` โดยไม่ต้องพึ่งพา Node.js หรืออินเทอร์เน็ต
2. **Next.js (`npm run dev`)**: สร้าง PDF ฝั่งไคลเอนต์ 100% ด้วย `@react-pdf/renderer` และฟอนต์ใน `public/fonts/`

## 1. Go Standalone & Serverless Engine
- **โมดูลหลัก**: `pkg/exporter/pdf.go`
- **ฟอนต์ที่ฝังลงในไบนารี**:
  - `pkg/exporter/fonts/THSarabunNew.ttf`
  - `pkg/exporter/fonts/THSarabunNew-Bold.ttf`
- **เอนด์พอยต์ HTTP**: `POST /api/export-pdf`
  - รับข้อมูล `ExportRequest` (Data, OTInputs, MonthIdx, Year, Pay, IsThai)
  - ส่งกลับไฟล์ PDF MIME `application/pdf` (inline display)
- **UI & Preview Modal**:
  - ฝังปุ่ม **Preview PDF** บน Header
  - แสดงตัวอย่างเอกสารผ่าน Glassmorphism Modal และ `<iframe>`
  - มีปุ่มดาวน์โหลดไฟล์ `.pdf` และปิดด้วยปุ่ม Esc
- **CLI Mode**:
  - รองรับการสร้าง PDF จากเทอร์มินัลโดยตรง:
    `./worktime.exe -parse <input.pdf> -export-pdf <output.pdf>`

## 2. Next.js Client-Side Engine (`npm run dev`)
- **โมดูลหลัก**: `src/lib/pdf-template.tsx`, `src/components/ExportPdfButton.tsx`, `src/components/PdfPreviewModal.tsx`
- **การทำงาน**: ไดนามิกอิมพอร์ต `@react-pdf/renderer` และเรนเดอร์ Blob URL ผ่านเบราว์เซอร์
