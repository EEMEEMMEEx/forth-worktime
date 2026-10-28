package exporter

import (
	_ "embed"
	"fmt"
	"io"
	"strings"

	"forth-worktime/pkg/worktime"

	"github.com/signintech/gopdf"
)

//go:embed fonts/THSarabunNew.ttf
var fontRegular []byte

//go:embed fonts/THSarabunNew-Bold.ttf
var fontBold []byte

//go:embed images/logo.png
var logoBytes []byte

// WritePdfTo generates an official A4 Monthly WorkTime and OT Report and writes it to w.
func WritePdfTo(w io.Writer, data []worktime.WorkDay, otInputs worktime.OTInputMap, monthIdx int, year int, pay worktime.PaySettings, isThai bool) error {
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: *gopdf.PageSizeA4})
	pdf.AddPage()

	// Register embedded Thai fonts
	if err := pdf.AddTTFFontData("THSarabunNew", fontRegular); err != nil {
		return fmt.Errorf("failed to register regular font: %w", err)
	}
	if err := pdf.AddTTFFontData("THSarabunNew-Bold", fontBold); err != nil {
		return fmt.Errorf("failed to register bold font: %w", err)
	}

	const leftMargin = 30.0
	const pageWidth = 535.0

	// 1. Company Header with Corporate Logo
	textStartX := leftMargin
	if len(logoBytes) > 0 {
		if imgHolder, err := gopdf.ImageHolderByBytes(logoBytes); err == nil {
			_ = pdf.ImageByHolder(imgHolder, leftMargin, 24, &gopdf.Rect{W: 80, H: 24})
			textStartX = leftMargin + 88
		}
	}

	pdf.SetFont("THSarabunNew-Bold", "", 16)
	pdf.SetTextColor(30, 58, 138) // Deep Blue (#1e3a8a)
	pdf.SetXY(textStartX, 26)
	_ = pdf.Cell(nil, "บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)")

	pdf.SetFont("THSarabunNew", "", 9)
	pdf.SetTextColor(100, 116, 139) // Slate-500
	pdf.SetXY(textStartX, 43)
	_ = pdf.Cell(nil, "FORTH CORPORATION PUBLIC COMPANY LIMITED")

	// Month/Year string
	thMonths := []string{"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"}
	enMonths := []string{"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"}
	
	monthName := ""
	if monthIdx >= 0 && monthIdx < 12 {
		if isThai {
			monthName = fmt.Sprintf("ประจำเดือน: %s %d", thMonths[monthIdx], year+543)
		} else {
			monthName = fmt.Sprintf("Month: %s %d", enMonths[monthIdx], year)
		}
	}

	// Badge on upper right
	pdf.SetFillColor(224, 231, 255) // Indigo-100
	pdf.SetStrokeColor(199, 210, 254)
	pdf.RectFromUpperLeftWithStyle(leftMargin+pageWidth-140, 28, 140, 22, "DF")
	pdf.SetFont("THSarabunNew-Bold", "", 11)
	pdf.SetTextColor(67, 56, 202) // Indigo-700
	pdf.SetXY(leftMargin+pageWidth-135, 33)
	_ = pdf.Cell(nil, monthName)

	// Divider line
	pdf.SetStrokeColor(203, 213, 225) // Slate-300
	pdf.SetLineWidth(0.8)
	pdf.Line(leftMargin, 58, leftMargin+pageWidth, 58)

	// 2. Document Title
	docTitle := "รายงานสรุปเวลาทำงานและค่าตอบแทนล่วงเวลา (Monthly WorkTime & OT Report)"
	if !isThai {
		docTitle = "Monthly WorkTime and Overtime Payout Report"
	}
	pdf.SetFont("THSarabunNew-Bold", "", 14)
	pdf.SetTextColor(15, 23, 42) // Slate-900
	titleWidth, _ := pdf.MeasureTextWidth(docTitle)
	pdf.SetXY(leftMargin+(pageWidth-titleWidth)/2, 65)
	_ = pdf.Cell(nil, docTitle)

	// 3. Compute Totals
	var totalNet, totalO10, totalO15, totalO20, totalO30 float64
	workDaysCount := 0
	for _, d := range data {
		totalNet += d.NetHours
		if d.NetHours > 0 {
			workDaysCount++
		}
		ot := otInputs[d.Day]
		totalO10 += ot.O10
		totalO15 += ot.O15
		totalO20 += ot.O20
		totalO30 += ot.O30
	}
	effectiveRate := 0.0
	if pay.BaseHours > 0 {
		effectiveRate = pay.MonthlySalary / float64(pay.BaseHours)
	}
	totalOtPay := (totalO10*1.0 + totalO15*1.5 + totalO20*2.0 + totalO30*3.0) * effectiveRate

	// 4. KPI Summary Box
	kpiBoxY := 86.0
	kpiBoxHeight := 34.0
	pdf.SetFillColor(248, 250, 252) // Slate-50
	pdf.SetStrokeColor(203, 213, 225)
	pdf.SetLineWidth(0.5)
	pdf.RectFromUpperLeftWithStyle(leftMargin, kpiBoxY, pageWidth, kpiBoxHeight, "DF")

	pdf.SetFont("THSarabunNew-Bold", "", 10.5)
	pdf.SetTextColor(51, 65, 85)

	colW := pageWidth / 4.0
	// KPI 1: Work days
	kpi1Label := "วันทำงานสุทธิ:"
	kpi1Unit := "วัน"
	if !isThai {
		kpi1Label = "Work Days:"
		kpi1Unit = "days"
	}
	pdf.SetXY(leftMargin+10, kpiBoxY+6)
	_ = pdf.Cell(nil, kpi1Label)
	pdf.SetTextColor(79, 70, 229)
	pdf.SetXY(leftMargin+10, kpiBoxY+18)
	_ = pdf.Cell(nil, fmt.Sprintf("%d %s", workDaysCount, kpi1Unit))

	// KPI 2: Total Net Hours
	kpi2Label := "ชม. ทำงานสุทธิรวม:"
	kpi2Unit := "ชม."
	if !isThai {
		kpi2Label = "Total Net Hours:"
		kpi2Unit = "hrs"
	}
	pdf.SetTextColor(51, 65, 85)
	pdf.SetXY(leftMargin+colW+10, kpiBoxY+6)
	_ = pdf.Cell(nil, kpi2Label)
	pdf.SetTextColor(79, 70, 229)
	pdf.SetXY(leftMargin+colW+10, kpiBoxY+18)
	_ = pdf.Cell(nil, fmt.Sprintf("%.2f %s", totalNet, kpi2Unit))

	// KPI 3: Base Salary
	kpi3Label := "ฐานเงินเดือน (บาท):"
	if !isThai {
		kpi3Label = "Base Salary (THB):"
	}
	pdf.SetTextColor(51, 65, 85)
	pdf.SetXY(leftMargin+colW*2+10, kpiBoxY+6)
	_ = pdf.Cell(nil, kpi3Label)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetXY(leftMargin+colW*2+10, kpiBoxY+18)
	_ = pdf.Cell(nil, fmt.Sprintf("%.2f ฿", pay.MonthlySalary))

	// KPI 4: Total OT Pay
	kpi4Label := "รวมค่าแรง OT สุทธิ:"
	if !isThai {
		kpi4Label = "Total OT Pay:"
	}
	pdf.SetTextColor(51, 65, 85)
	pdf.SetXY(leftMargin+colW*3+10, kpiBoxY+6)
	_ = pdf.Cell(nil, kpi4Label)
	pdf.SetTextColor(5, 150, 105) // Emerald-600
	pdf.SetXY(leftMargin+colW*3+10, kpiBoxY+18)
	_ = pdf.Cell(nil, fmt.Sprintf("%.2f ฿", totalOtPay))

	// 5. Work Table Grid
	tableY := 128.0
	rowHeight := 17.5

	// Column Widths: total = 535.0
	colWidths := []float64{65.0, 105.0, 55.0, 45.0, 45.0, 45.0, 45.0, 130.0}
	colHeaders := []string{"วันที่", "เวลาเข้า-ออก", "ชม.สุทธิ", "OT 1.0", "OT 1.5", "OT 2.0", "OT 3.0", "สถานะ"}
	if !isThai {
		colHeaders = []string{"Date", "In-Out Time", "Net (Hrs)", "OT 1.0", "OT 1.5", "OT 2.0", "OT 3.0", "Status"}
	}

	// Table Header Row
	pdf.SetFillColor(241, 245, 249) // Slate-100
	pdf.SetStrokeColor(148, 163, 184) // Slate-400
	pdf.SetLineWidth(0.6)
	pdf.RectFromUpperLeftWithStyle(leftMargin, tableY, pageWidth, 20.0, "DF")

	curX := leftMargin
	pdf.SetFont("THSarabunNew-Bold", "", 10.5)
	pdf.SetTextColor(15, 23, 42)

	for i, h := range colHeaders {
		w := colWidths[i]
		if i > 0 {
			pdf.Line(curX, tableY, curX, tableY+20.0)
		}
		pdf.SetXY(curX, tableY)
		_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: 20.0}, h, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
		curX += w
	}

	curY := tableY + 20.0

	// Table Rows (Data)
	pdf.SetLineWidth(0.3)
	pdf.SetStrokeColor(203, 213, 225) // Slate-300

	for _, d := range data {
		ot := otInputs[d.Day]
		isWeekend := strings.Contains(d.Status, "วันหยุด") || strings.Contains(strings.ToLower(d.Status), "weekend") || strings.Contains(strings.ToLower(d.Status), "holiday")

		if isWeekend {
			pdf.SetFillColor(250, 250, 250) // Slate-50 tint
			pdf.RectFromUpperLeftWithStyle(leftMargin, curY, pageWidth, rowHeight, "F")
		}

		// Row border bottom
		pdf.Line(leftMargin, curY+rowHeight, leftMargin+pageWidth, curY+rowHeight)

		curX = leftMargin
		for i, w := range colWidths {
			if i > 0 {
				pdf.Line(curX, curY, curX, curY+rowHeight)
			}

			pdf.SetXY(curX, curY)
			pdf.SetFont("THSarabunNew", "", 10)
			pdf.SetTextColor(51, 65, 85)

			switch i {
			case 0: // Date
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, d.Date, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 1: // In-Out
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, d.InOut, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 2: // Net
				if d.NetHours > 0 {
					pdf.SetFont("THSarabunNew-Bold", "", 10)
					pdf.SetTextColor(79, 70, 229)
					_ = pdf.CellWithOption(&gopdf.Rect{W: w - 6, H: rowHeight}, fmt.Sprintf("%.2f", d.NetHours), gopdf.CellOption{Align: gopdf.Right | gopdf.Middle})
				} else {
					pdf.SetTextColor(148, 163, 184)
					_ = pdf.CellWithOption(&gopdf.Rect{W: w - 6, H: rowHeight}, "0.00", gopdf.CellOption{Align: gopdf.Right | gopdf.Middle})
				}
			case 3: // OT 1.0
				val := ot.O10
				text := "-"
				if val > 0 {
					text = fmt.Sprintf("%.1f", val)
					pdf.SetFont("THSarabunNew-Bold", "", 10)
				}
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, text, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 4: // OT 1.5
				val := ot.O15
				text := "-"
				if val > 0 {
					text = fmt.Sprintf("%.1f", val)
					pdf.SetFont("THSarabunNew-Bold", "", 10)
				}
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, text, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 5: // OT 2.0
				val := ot.O20
				text := "-"
				if val > 0 {
					text = fmt.Sprintf("%.1f", val)
					pdf.SetFont("THSarabunNew-Bold", "", 10)
				}
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, text, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 6: // OT 3.0
				val := ot.O30
				text := "-"
				if val > 0 {
					text = fmt.Sprintf("%.1f", val)
					pdf.SetFont("THSarabunNew-Bold", "", 10)
				}
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, text, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			case 7: // Status
				if isWeekend {
					pdf.SetTextColor(217, 119, 6) // Amber-600
				}
				_ = pdf.CellWithOption(&gopdf.Rect{W: w, H: rowHeight}, d.Status, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
			}

			curX += w
		}
		curY += rowHeight
	}

	// 6. Summary Footer Row
	summaryH := 20.0
	pdf.SetFillColor(241, 245, 249)
	pdf.SetStrokeColor(148, 163, 184)
	pdf.SetLineWidth(0.6)
	pdf.RectFromUpperLeftWithStyle(leftMargin, curY, pageWidth, summaryH, "DF")

	curX = leftMargin
	pdf.SetFont("THSarabunNew-Bold", "", 10.5)
	pdf.SetTextColor(15, 23, 42)

	// Col 0 & 1 merged: "รวมสุทธิ (Total)"
	spanW := colWidths[0] + colWidths[1]
	sumLabel := "รวมสุทธิ (Total)"
	if !isThai {
		sumLabel = "Total"
	}
	pdf.SetXY(curX, curY)
	_ = pdf.CellWithOption(&gopdf.Rect{W: spanW, H: summaryH}, sumLabel, gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
	curX += spanW
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 2: Total Net Hours
	pdf.SetXY(curX, curY)
	pdf.SetTextColor(79, 70, 229)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[2] - 6, H: summaryH}, fmt.Sprintf("%.2f", totalNet), gopdf.CellOption{Align: gopdf.Right | gopdf.Middle})
	curX += colWidths[2]
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 3: Total O10
	pdf.SetXY(curX, curY)
	pdf.SetTextColor(15, 23, 42)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[3], H: summaryH}, fmt.Sprintf("%.1f", totalO10), gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
	curX += colWidths[3]
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 4: Total O15
	pdf.SetXY(curX, curY)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[4], H: summaryH}, fmt.Sprintf("%.1f", totalO15), gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
	curX += colWidths[4]
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 5: Total O20
	pdf.SetXY(curX, curY)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[5], H: summaryH}, fmt.Sprintf("%.1f", totalO20), gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
	curX += colWidths[5]
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 6: Total O30
	pdf.SetXY(curX, curY)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[6], H: summaryH}, fmt.Sprintf("%.1f", totalO30), gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})
	curX += colWidths[6]
	pdf.Line(curX, curY, curX, curY+summaryH)

	// Col 7: Empty or status label
	pdf.SetXY(curX, curY)
	_ = pdf.CellWithOption(&gopdf.Rect{W: colWidths[7], H: summaryH}, "-", gopdf.CellOption{Align: gopdf.Center | gopdf.Middle})

	// Outer border for table
	pdf.SetStrokeColor(148, 163, 184)
	pdf.SetLineWidth(0.8)
	pdf.RectFromUpperLeftWithStyle(leftMargin, tableY, pageWidth, curY+summaryH-tableY, "D")

	// 7. Footer note
	pdf.SetFont("THSarabunNew", "", 8.5)
	pdf.SetTextColor(148, 163, 184)
	footerText := "เอกสารสร้างโดยระบบ WorkTime Analyzer (Go Standalone Edition) - จัดทำเพื่อใช้เป็นหลักฐานประกอบการเบิกจ่ายค่าล่วงเวลา"
	footerW, _ := pdf.MeasureTextWidth(footerText)
	pdf.SetXY(leftMargin+(pageWidth-footerW)/2, curY+summaryH+8)
	_ = pdf.Cell(nil, footerText)

	_, err := pdf.WriteTo(w)
	return err
}
