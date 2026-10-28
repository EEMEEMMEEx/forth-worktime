package repository_test

import (
	"path/filepath"
	"testing"

	"forth-worktime/pkg/repository"
	"forth-worktime/pkg/worktime"
)

func TestSQLiteRepository(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test_worktime.db")

	repo, err := repository.NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("failed to create repo: %v", err)
	}
	defer repo.Close()

	// Initial load should be empty map
	saved, _, err := repo.LoadOTData(2026, 2)
	if err != nil {
		t.Fatalf("failed to load initial OT data: %v", err)
	}
	if len(saved) != 0 {
		t.Errorf("expected 0 OT entries initially, got %d", len(saved))
	}

	// Save test data
	testOT := worktime.OTInputMap{
		1: {O10: 1.0, O15: 0.0, O20: 0.0, O30: 0.0},
	}

	updatedAt, err := repo.SaveOTData(2026, 2, testOT)
	if err != nil {
		t.Fatalf("failed to save OT data: %v", err)
	}
	if updatedAt <= 0 {
		t.Errorf("expected positive updatedAt timestamp, got %d", updatedAt)
	}

	// Reload and verify
	loadedOT, loadedTime, err := repo.LoadOTData(2026, 2)
	if err != nil {
		t.Fatalf("failed to reload OT data: %v", err)
	}
	if len(loadedOT) != 1 {
		t.Fatalf("expected 1 OT entry loaded, got %d", len(loadedOT))
	}
	if loadedOT[1].O10 != 1.0 {
		t.Errorf("expected O10 = 1.0, got %f", loadedOT[1].O10)
	}
	if loadedTime != updatedAt {
		t.Errorf("expected timestamp %d, got %d", updatedAt, loadedTime)
	}

	// Test PaySettings
	pay := worktime.PaySettings{MonthlySalary: 50000, BaseHours: 240}
	if err := repo.SavePaySettings(pay); err != nil {
		t.Fatalf("failed to save pay settings: %v", err)
	}

	loadedPay, err := repo.LoadPaySettings()
	if err != nil {
		t.Fatalf("failed to load pay settings: %v", err)
	}
	if loadedPay.MonthlySalary != 50000 || loadedPay.BaseHours != 240 {
		t.Errorf("unexpected pay settings: %+v", loadedPay)
	}
}
