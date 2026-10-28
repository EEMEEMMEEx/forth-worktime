# ⏱️ Forth WorkTime Analyzer (Go Standalone Edition)

โปรแกรมสรุปเวลาทำงานและคำนวณค่าตอบแทนล่วงเวลา (OT) รายเดือน พัฒนาด้วยภาษา Go ในรูปแบบ Single Binary พร้อมเว็บแอปพลิเคชันและระบบฐานข้อมูล SQLite ภายในตัว

## ✨ จุดเด่นและความสามารถ (Features)

- **🚀 Pure Go PDF Parsing**: แยกและวิเคราะห์เวลาเข้า-ออกงานจากไฟล์ PDF Attendance/Timestatement รายเดือนด้วยภาษา Go ล้วน (`github.com/ledongthuc/pdf`)
- **📊 Interactive Dashboard**: คำนวณชั่วโมงสุทธิ, วันทำงาน, วันหยุด, และค่าตอบแทนล่วงเวลาแบบเรียลไทม์ พร้อมกราฟิกสถิติ (Alpine.js + Chart.js + Tailwind CSS)
- **💾 Local SQLite Persistence**: บันทึกข้อมูลค่า OT และเงินเดือนลงฐานข้อมูล SQLite ในเครื่องอัตโนมัติ (Zero-CGO `modernc.org/sqlite`)
- **📄 Official A4 PDF Report**: สร้างและดูตัวอย่างรายงาน A4 ภาษาไทย (ฟอนต์ `THSarabunNew` ฝังในตัว) พร้อมพิมพ์หรือดาวน์โหลดได้ทันที
- **📑 Excel Export**: ส่งออกรายงานรูปแบบ Spreadsheet `.xlsx` (`github.com/xuri/excelize/v2`)
- **🖥️ Dual Mode**: รองรับทั้งโหมดเว็บเซิร์ฟเวอร์ และโหมดคอมมานด์ไลน์ (CLI)

---

## 🛠️ โครงสร้างทางเทคนิค (Tech Stack)

- **Language**: Go 1.22+
- **Database**: SQLite (Pure Go driver: `modernc.org/sqlite`)
- **PDF Extraction**: `github.com/ledongthuc/pdf`
- **PDF Report Generator**: `github.com/signintech/gopdf` (พร้อมฟอนต์ THSarabunNew ฝังในตัวผ่าน `//go:embed`)
- **Excel Generator**: `github.com/xuri/excelize/v2`
- **Web UI**: Embedded Template (`net/http` + Alpine.js + Tailwind CSS)

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### 1. การรันในโหมดเว็บแอปพลิเคชัน (Web Server Mode)
```bash
# คอมไพล์และเปิดใช้งานเว็บเซิร์ฟเวอร์
go run ./cmd/worktime
# หรือรันไฟล์ไบนารีโดยตรง
./worktime.exe
```
เมื่อรันแล้ว เปิดเบราว์เซอร์ไปที่: `http://localhost:8080`

### 2. การใช้งานผ่านคอมมานด์ไลน์ (CLI Mode)
```bash
# วิเคราะห์ไฟล์ PDF และส่งออกเป็น Excel
./worktime.exe -parse TIMESTATEMENT_20260502.pdf -export output.xlsx

# วิเคราะห์ไฟล์ PDF และส่งออกเป็น PDF รายงาน A4
./worktime.exe -parse TIMESTATEMENT_20260502.pdf -export-pdf report.pdf
```

### 3. การทดสอบและบิลด์ (Testing & Building)
```bash
# รันการทดสอบทั้งหมด
go test -v ./...

# บิลด์ไบนารีสำหรับนำไปแจกจ่าย
go build -o worktime.exe ./cmd/worktime
```

---

## 📚 ฐานความรู้และเอกสารเพิ่มเติม (Wiki)
เอกสารสถาปัตยกรรมและการออกแบบระบบ ดูรายละเอียดได้ในโฟลเดอร์ [wiki/](./wiki/index.md)
