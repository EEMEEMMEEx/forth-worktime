package repository_test

import (
	"path/filepath"
	"testing"

	"forth-worktime/internal/repository"
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

	// 1. Test Pay Settings default and save
	pay, err := repo.LoadPaySettings()
	if err != nil {
		t.Fatalf("failed to load default pay settings: %v", err)
	}
	if pay.BaseHours != 240 {
		t.Errorf("expected default baseHours=240, got %f", pay.BaseHours)
	}

	err = repo.SavePaySettings(worktime.PaySettings{MonthlySalary: 35000, BaseHours: 208})
	if err != nil {
		t.Fatalf("failed to save pay settings: %v", err)
	}
	pay, err = repo.LoadPaySettings()
	if err != nil || pay.MonthlySalary != 35000 || pay.BaseHours != 208 {
		t.Errorf("expected 35000/208, got %+v (err: %v)", pay, err)
	}

	// 2. Test OT Data save and load
	data := worktime.OTInputMap{
		15: {O10: 8, O15: 0, O20: 0, O30: 3.5},
	}
	ts, err := repo.SaveOTData(2026, 2, data) // March 2026
	if err != nil || ts <= 0 {
		t.Fatalf("failed to save OT data: %v", err)
	}

	loaded, loadedTs, err := repo.LoadOTData(2026, 2)
	if err != nil {
		t.Fatalf("failed to load OT data: %v", err)
	}
	if loadedTs != ts {
		t.Errorf("expected ts=%d, got %d", ts, loadedTs)
	}
	if loaded[15].O30 != 3.5 {
		t.Errorf("expected O30=3.5, got %f", loaded[15].O30)
	}
}
