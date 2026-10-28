package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVercelHandler(t *testing.T) {
	// Test root GET /
	reqIndex := httptest.NewRequest("GET", "/", nil)
	wIndex := httptest.NewRecorder()
	Handler(wIndex, reqIndex)

	if wIndex.Code != http.StatusOK {
		t.Fatalf("expected / -> 200, got %d", wIndex.Code)
	}
	if wIndex.Body.Len() < 1000 {
		t.Fatalf("expected HTML body, got %d bytes", wIndex.Body.Len())
	}

	// Test GET /api/version
	reqVer := httptest.NewRequest("GET", "/api/version", nil)
	wVer := httptest.NewRecorder()
	Handler(wVer, reqVer)

	if wVer.Code != http.StatusOK {
		t.Fatalf("expected /api/version -> 200, got %d", wVer.Code)
	}

	var verResp map[string]string
	if err := json.Unmarshal(wVer.Body.Bytes(), &verResp); err != nil {
		t.Fatalf("failed to decode version: %v", err)
	}
	if verResp["status"] != "ok" {
		t.Errorf("expected status ok, got %v", verResp)
	}

	// Test GET /static/icons/sun.svg
	reqStatic := httptest.NewRequest("GET", "/static/icons/sun.svg", nil)
	wStatic := httptest.NewRecorder()
	Handler(wStatic, reqStatic)

	if wStatic.Code != http.StatusOK {
		t.Fatalf("expected /static/icons/sun.svg -> 200, got %d", wStatic.Code)
	}
}
