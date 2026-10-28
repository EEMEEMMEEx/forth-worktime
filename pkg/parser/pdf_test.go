package parser_test

import (
	"os"
	"path/filepath"
	"testing"

	"forth-worktime/pkg/parser"
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

	if result.Year <= 0 {
		t.Errorf("Expected positive year, got %d", result.Year)
	}
	if result.MonthIdx < 0 || result.MonthIdx > 11 {
		t.Errorf("Expected month index between 0-11, got %d", result.MonthIdx)
	}
	if len(result.Results) == 0 {
		t.Errorf("Expected parsed days, got 0")
	}

	// Verify sample has days
	hasDays := len(result.Results) >= 28
	if !hasDays {
		t.Errorf("Expected at least 28 days for month, got %d", len(result.Results))
	}

	t.Logf("Successfully parsed month %d/%d with %d days, %d days with OT inputs",
		result.MonthIdx+1, result.Year, len(result.Results), len(result.OTInputs))
}
