package exporter

import (
	"fmt"
	"io"

	"forth-worktime/pkg/worktime"

	"github.com/xuri/excelize/v2"
)

// GenerateExcel creates an Excel workbook containing the parsed attendance and OT breakdown.
func GenerateExcel(data []worktime.WorkDay, otInputs worktime.OTInputMap, isThai bool) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Worktime"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"วันที่", "เวลาเข้า-ออก", "ชม. (สุทธิ)", "OT 1.0", "OT 1.5", "OT 2.0", "OT 3.0", "สถานะ"}
	summaryLabel := "สรุปยอดรวม"
	if !isThai {
		headers = []string{"Date", "In-Out Time", "Net (Hrs)", "OT 1.0", "OT 1.5", "OT 2.0", "OT 3.0", "Status"}
		summaryLabel = "Total Summary"
	}

	// 1. Write Header Row
	for colIdx, h := range headers {
		cell, err := excelize.CoordinatesToCellName(colIdx+1, 1)
		if err != nil {
			return nil, err
		}
		if err := f.SetCellValue(sheet, cell, h); err != nil {
			return nil, err
		}
	}

	// 2. Data Rows
	var totalNet, totalO10, totalO15, totalO20, totalO30 float64
	rowIdx := 2
	for _, d := range data {
		ot := otInputs[d.Day]

		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIdx), d.Date)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIdx), d.InOut)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIdx), d.NetHours)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIdx), ot.O10)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIdx), ot.O15)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIdx), ot.O20)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIdx), ot.O30)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", rowIdx), d.Status)

		totalNet += d.NetHours
		totalO10 += ot.O10
		totalO15 += ot.O15
		totalO20 += ot.O20
		totalO30 += ot.O30
		rowIdx++
	}

	// 3. Totals Summary Row
	f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIdx), summaryLabel)
	f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIdx), "")
	f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIdx), totalNet)
	f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIdx), totalO10)
	f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIdx), totalO15)
	f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIdx), totalO20)
	f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIdx), totalO30)
	f.SetCellValue(sheet, fmt.Sprintf("H%d", rowIdx), "")

	// 4. Set Column Widths (equivalent to wch: 15)
	if err := f.SetColWidth(sheet, "A", "H", 15); err != nil {
		return nil, err
	}

	return f, nil
}

// WriteExcelTo writes the generated Excel workbook to an io.Writer stream.
func WriteExcelTo(w io.Writer, data []worktime.WorkDay, otInputs worktime.OTInputMap, isThai bool) error {
	f, err := GenerateExcel(data, otInputs, isThai)
	if err != nil {
		return err
	}
	defer f.Close()
	return f.Write(w)
}
