package exporter_test

import (
	"bytes"
	"testing"

	"forth-worktime/pkg/exporter"
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
		t.Fatalf("Generated Excel buffer is empty")
	}

	// Verify magic bytes of xlsx (zip archive: PK\x03\x04)
	bytesData := buf.Bytes()
	if len(bytesData) < 4 || string(bytesData[:2]) != "PK" {
		t.Errorf("Exported file does not appear to be a valid zip/xlsx archive")
	}
}
