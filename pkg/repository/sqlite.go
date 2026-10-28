package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"forth-worktime/pkg/worktime"

	_ "modernc.org/sqlite"
)

// Repository manages persistence for overtime data and pay configuration.
type Repository struct {
	db *sql.DB
}

// NewSQLiteRepository creates or opens a SQLite database at the specified path and initializes tables.
func NewSQLiteRepository(dbPath string) (*Repository, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	repo := &Repository{db: db}
	if err := repo.initSchema(); err != nil {
		db.Close()
		return nil, err
	}

	return repo, nil
}

// Close closes the underlying database connection.
func (r *Repository) Close() error {
	return r.db.Close()
}

func (r *Repository) initSchema() error {
	query := `
	CREATE TABLE IF NOT EXISTS worktime_records (
		year_month TEXT PRIMARY KEY,
		ot_inputs TEXT NOT NULL,
		updated_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS pay_settings (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		monthly_salary REAL NOT NULL,
		base_hours REAL NOT NULL
	);
	`
	_, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}
	return nil
}

// SaveOTData persists overtime data for a given year and month (0-indexed month: 0..11).
func (r *Repository) SaveOTData(year, monthIdx int, data worktime.OTInputMap) (int64, error) {
	docID := fmt.Sprintf("%04d_%02d", year, monthIdx+1)
	nowMs := time.Now().UnixMilli()

	encoded, err := json.Marshal(data)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal OT data: %w", err)
	}

	query := `
	INSERT INTO worktime_records (year_month, ot_inputs, updated_at)
	VALUES (?, ?, ?)
	ON CONFLICT(year_month) DO UPDATE SET
		ot_inputs = excluded.ot_inputs,
		updated_at = excluded.updated_at;
	`
	_, err = r.db.Exec(query, docID, string(encoded), nowMs)
	if err != nil {
		return 0, fmt.Errorf("failed to save OT data: %w", err)
	}

	return nowMs, nil
}

// LoadOTData retrieves saved overtime data for a given year and month.
func (r *Repository) LoadOTData(year, monthIdx int) (worktime.OTInputMap, int64, error) {
	docID := fmt.Sprintf("%04d_%02d", year, monthIdx+1)
	query := `SELECT ot_inputs, updated_at FROM worktime_records WHERE year_month = ?`

	var rawJSON string
	var updatedAt int64
	err := r.db.QueryRow(query, docID).Scan(&rawJSON, &updatedAt)
	if err == sql.ErrNoRows {
		return make(worktime.OTInputMap), 0, nil
	}
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query OT data: %w", err)
	}

	var otInputs worktime.OTInputMap
	if err := json.Unmarshal([]byte(rawJSON), &otInputs); err != nil {
		return nil, 0, fmt.Errorf("failed to unmarshal saved OT data: %w", err)
	}

	return otInputs, updatedAt, nil
}

// SavePaySettings stores monthly salary and base hours.
func (r *Repository) SavePaySettings(settings worktime.PaySettings) error {
	query := `
	INSERT INTO pay_settings (id, monthly_salary, base_hours)
	VALUES (1, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		monthly_salary = excluded.monthly_salary,
		base_hours = excluded.base_hours;
	`
	_, err := r.db.Exec(query, settings.MonthlySalary, settings.BaseHours)
	return err
}

// LoadPaySettings loads saved pay settings, falling back to defaults if not set.
func (r *Repository) LoadPaySettings() (worktime.PaySettings, error) {
	query := `SELECT monthly_salary, base_hours FROM pay_settings WHERE id = 1`
	var settings worktime.PaySettings
	err := r.db.QueryRow(query).Scan(&settings.MonthlySalary, &settings.BaseHours)
	if err == sql.ErrNoRows {
		return worktime.PaySettings{MonthlySalary: 0, BaseHours: 240}, nil
	}
	if err != nil {
		return worktime.PaySettings{}, err
	}
	return settings, nil
}
