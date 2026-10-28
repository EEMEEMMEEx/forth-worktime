package server_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"forth-worktime/internal/repository"
	"forth-worktime/internal/server"
	"forth-worktime/pkg/worktime"
)

func setupTestServer(t *testing.T) (*server.Server, *repository.Repository) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")
	repo, err := repository.NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("failed to create sqlite repo: %v", err)
	}

	srv := server.NewServer(repo)
	return srv, repo
}

func TestServerVersionAndIndex(t *testing.T) {
	srv, repo := setupTestServer(t)
	defer repo.Close()

	// 1. GET /
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	srv.Handler().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected GET / -> 200, got %d", w.Code)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte("WorkTime Analyzer")) {
		t.Errorf("expected HTML body to contain 'WorkTime Analyzer'")
	}

	// 2. GET /api/version
	reqVer := httptest.NewRequest("GET", "/api/version", nil)
	wVer := httptest.NewRecorder()
	srv.Handler().ServeHTTP(wVer, reqVer)

	if wVer.Code != http.StatusOK {
		t.Errorf("expected GET /api/version -> 200, got %d", wVer.Code)
	}

	var verResp map[string]string
	if err := json.Unmarshal(wVer.Body.Bytes(), &verResp); err != nil {
		t.Fatalf("failed to parse version json: %v", err)
	}
	if verResp["version"] != worktime.Version {
		t.Errorf("expected version %q, got %q", worktime.Version, verResp["version"])
	}

	// 3. GET /static/icons/moon.svg
	reqStatic := httptest.NewRequest("GET", "/static/icons/moon.svg", nil)
	wStatic := httptest.NewRecorder()
	srv.Handler().ServeHTTP(wStatic, reqStatic)

	if wStatic.Code != http.StatusOK {
		t.Errorf("expected GET /static/icons/moon.svg -> 200, got %d", wStatic.Code)
	}
	if !bytes.Contains(wStatic.Body.Bytes(), []byte("<svg")) {
		t.Errorf("expected SVG content in static response")
	}
}

func TestServerUploadAndExport(t *testing.T) {
	srv, repo := setupTestServer(t)
	defer repo.Close()

	fixturePath := filepath.Join("..", "..", "TIMESTATEMENT_20260502.pdf")
	pdfData, err := os.ReadFile(fixturePath)
	if err != nil {
		t.Skipf("sample fixture not found: %v", err)
	}

	// Prepare multipart form
	var b bytes.Buffer
	writer := multipart.NewWriter(&b)
	part, err := writer.CreateFormFile("file", "TIMESTATEMENT_20260502.pdf")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	part.Write(pdfData)
	writer.Close()

	// POST /api/upload
	req := httptest.NewRequest("POST", "/api/upload", &b)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	srv.Handler().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected /api/upload -> 200, got %d: %s", w.Code, w.Body.String())
	}

	var uploadResp struct {
		Success  bool               `json:"success"`
		MonthIdx int                `json:"monthIdx"`
		Year     int                `json:"year"`
		Data     []worktime.WorkDay `json:"data"`
		OTInputs worktime.OTInputMap `json:"otInputs"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &uploadResp); err != nil {
		t.Fatalf("failed to decode upload response: %v", err)
	}

	if !uploadResp.Success || uploadResp.Year != 2026 || len(uploadResp.Data) == 0 {
		t.Errorf("unexpected upload response: %+v", uploadResp)
	}

	// Test POST /api/save
	saveBody, _ := json.Marshal(map[string]interface{}{
		"year":     uploadResp.Year,
		"monthIdx": uploadResp.MonthIdx,
		"otInputs": worktime.OTInputMap{
			1: {O10: 8, O15: 0, O20: 0, O30: 0},
		},
	})
	saveReq := httptest.NewRequest("POST", "/api/save", bytes.NewReader(saveBody))
	saveW := httptest.NewRecorder()
	srv.Handler().ServeHTTP(saveW, saveReq)

	if saveW.Code != http.StatusOK {
		t.Errorf("expected /api/save -> 200, got %d: %s", saveW.Code, saveW.Body.String())
	}

	// Test POST /api/export
	exportBody, _ := json.Marshal(map[string]interface{}{
		"data":     uploadResp.Data,
		"otInputs": uploadResp.OTInputs,
		"monthIdx": uploadResp.MonthIdx,
		"year":     uploadResp.Year,
		"isThai":   true,
	})
	exportReq := httptest.NewRequest("POST", "/api/export", bytes.NewReader(exportBody))
	exportW := httptest.NewRecorder()
	srv.Handler().ServeHTTP(exportW, exportReq)

	if exportW.Code != http.StatusOK {
		t.Errorf("expected /api/export -> 200, got %d: %s", exportW.Code, exportW.Body.String())
	}
	excelBytes, _ := io.ReadAll(exportW.Body)
	if len(excelBytes) < 100 {
		t.Errorf("expected valid Excel file bytes, got length %d", len(excelBytes))
	}

	// Test POST /api/export-pdf
	pdfBody, _ := json.Marshal(map[string]interface{}{
		"data":     uploadResp.Data,
		"otInputs": uploadResp.OTInputs,
		"monthIdx": uploadResp.MonthIdx,
		"year":     uploadResp.Year,
		"pay":      worktime.PaySettings{MonthlySalary: 35000, BaseHours: 240},
		"isThai":   true,
	})
	pdfReq := httptest.NewRequest("POST", "/api/export-pdf", bytes.NewReader(pdfBody))
	pdfW := httptest.NewRecorder()
	srv.Handler().ServeHTTP(pdfW, pdfReq)

	if pdfW.Code != http.StatusOK {
		t.Errorf("expected /api/export-pdf -> 200, got %d: %s", pdfW.Code, pdfW.Body.String())
	}
	if pdfW.Header().Get("Content-Type") != "application/pdf" {
		t.Errorf("expected application/pdf, got %s", pdfW.Header().Get("Content-Type"))
	}
	pdfBytes, _ := io.ReadAll(pdfW.Body)
	if len(pdfBytes) < 1000 {
		t.Errorf("expected valid PDF file bytes, got length %d", len(pdfBytes))
	}
}
