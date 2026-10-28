package parser_test

import (
	"os"
	"path/filepath"
	"testing"

	"forth-worktime/internal/parser"
)

func TestAnalyzePDFSmoke(t *testing.T) {
	fixturePath := filepath.Join("..", "..", "TIMESTATEMENT_20260502.pdf")
	data, err := os.ReadFile(fixturePath)
	if err != nil {
		t.Skipf("sample fixture not found: %v", err)
	}

	result, err := parser.AnalyzePDFBytes(data)
	if err != nil {
		t.Fatalf("AnalyzePDFBytes failed: %v", err)
	}

	if result.Year < 2020 {
		t.Errorf("expected Year >= 2020, got %d", result.Year)
	}
	if result.MonthIdx < 0 || result.MonthIdx > 11 {
		t.Errorf("expected MonthIdx in 0..11, got %d", result.MonthIdx)
	}
	if len(result.Results) < 28 || len(result.Results) > 31 {
		t.Errorf("expected 28..31 days, got %d", len(result.Results))
	}

	hasWorkHours := false
	for _, day := range result.Results {
		if day.NetHours > 0 {
			hasWorkHours = true
			break
		}
	}
	if !hasWorkHours {
		t.Errorf("expected at least one day with NetHours > 0")
	}

	t.Logf("Successfully parsed month %d/%d with %d days, %d days with OT inputs",
		result.MonthIdx+1, result.Year, len(result.Results), len(result.OTInputs))
}
