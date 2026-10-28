package exporter_test

import (
	"bytes"
	"testing"

	"forth-worktime/internal/exporter"
	"forth-worktime/pkg/worktime"
)

func TestGenerateExcel(t *testing.T) {
	data := []worktime.WorkDay{
		{Day: 1, Date: "01.03.2026", InOut: "08:00-17:00", NetHours: 8.0, Status: worktime.StatusNormal, DayOfWeek: 1},
		{Day: 2, Date: "02.03.2026", InOut: "08:00-21:00", NetHours: 11.5, Status: worktime.StatusNormal, DayOfWeek: 2},
	}
	otInputs := worktime.OTInputMap{
		2: {O10: 0, O15: 3.5, O20: 0, O30: 0},
	}

	var buf bytes.Buffer
	err := exporter.WriteExcelTo(&buf, data, otInputs, false)
	if err != nil {
		t.Fatalf("WriteExcelTo failed: %v", err)
	}

	if buf.Len() == 0 {
		t.Fatalf("expected non-empty Excel buffer")
	}

	f, err := exporter.GenerateExcel(data, otInputs, false)
	if err != nil {
		t.Fatalf("GenerateExcel failed: %v", err)
	}
	defer f.Close()

	val, err := f.GetCellValue("Worktime", "A1")
	if err != nil || val != "Date" {
		t.Errorf("expected A1='Date', got %q (err: %v)", val, err)
	}

	totalNet, err := f.GetCellValue("Worktime", "C4")
	if err != nil || totalNet != "19.5" {
		t.Errorf("expected C4='19.5', got %q (err: %v)", totalNet, err)
	}
}
