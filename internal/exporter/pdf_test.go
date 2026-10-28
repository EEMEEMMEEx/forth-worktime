package exporter

import (
	"bytes"
	"testing"

	"forth-worktime/pkg/worktime"
)

func TestWritePdfTo(t *testing.T) {
	data := []worktime.WorkDay{
		{Day: 1, Date: "01.10.2026", InOut: "08:00-17:00", NetHours: 8.0, Status: "-"},
		{Day: 2, Date: "02.10.2026", InOut: "08:00-18:00", NetHours: 9.0, Status: "-"},
		{Day: 3, Date: "03.10.2026", InOut: "-", NetHours: 0.0, Status: "วันหยุดสุดสัปดาห์"},
	}

	otInputs := worktime.OTInputMap{
		1: {O10: 1.0, O15: 0.0, O20: 0.0, O30: 0.0},
		2: {O10: 0.0, O15: 2.0, O20: 0.0, O30: 0.0},
	}

	pay := worktime.PaySettings{
		MonthlySalary: 30000.0,
		BaseHours:     240,
	}

	var buf bytes.Buffer
	err := WritePdfTo(&buf, data, otInputs, 9, 2026, pay, true)
	if err != nil {
		t.Fatalf("WritePdfTo failed: %v", err)
	}

	if buf.Len() < 1000 {
		t.Fatalf("PDF buffer unexpectedly small: %d bytes", buf.Len())
	}
	t.Logf("Successfully created Monthly PDF Report: %d bytes", buf.Len())
}
