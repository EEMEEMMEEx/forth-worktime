package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"forth-worktime/pkg/exporter"
	"forth-worktime/pkg/parser"
	"forth-worktime/pkg/repository"
	"forth-worktime/pkg/worktime"
)

type Server struct {
	repo *repository.Repository
	mux  *http.ServeMux
}

func NewServer(repo *repository.Repository) *Server {
	s := &Server{
		repo: repo,
		mux:  http.NewServeMux(),
	}
	s.registerRoutes()
	return s
}

func (s *Server) Handler() http.Handler {
	return s.mux
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("GET /", s.handleIndex)
	s.mux.Handle("GET /static/", staticFileServer())
	s.mux.HandleFunc("POST /api/upload", s.handleUpload)
	s.mux.HandleFunc("POST /api/save", s.handleSaveOT)
	s.mux.HandleFunc("GET /api/load", s.handleLoadOT)
	s.mux.HandleFunc("GET /api/pay", s.handleGetPay)
	s.mux.HandleFunc("POST /api/pay", s.handleSavePay)
	s.mux.HandleFunc("POST /api/export", s.handleExport)
	s.mux.HandleFunc("POST /api/export-pdf", s.handleExportPdf)
	s.mux.HandleFunc("GET /api/version", s.handleVersion)
}

func (s *Server) handleVersion(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"version": worktime.Version,
		"status":  "ok",
	})
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(indexHTML))
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		http.Error(w, "Failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Please provide a valid PDF file in field 'file'", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if header.Size == 0 {
		http.Error(w, "Uploaded file is empty", http.StatusBadRequest)
		return
	}

	pdfBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file contents: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result, err := parser.AnalyzePDFBytes(pdfBytes)
	if err != nil {
		http.Error(w, "PDF Parsing error: "+err.Error(), http.StatusUnprocessableEntity)
		return
	}

	// Check if there is already saved OT data in SQLite for this month/year
	savedOT, savedAt, err := s.repo.LoadOTData(result.Year, result.MonthIdx)
	if err == nil && len(savedOT) > 0 {
		// Merge saved OT data into parsed OT inputs
		for day, ot := range savedOT {
			result.OTInputs[day] = ot
		}
	}

	// Get pay settings
	pay, _ := s.repo.LoadPaySettings()

	response := map[string]interface{}{
		"success":   true,
		"data":      result.Results,
		"monthIdx":  result.MonthIdx,
		"year":      result.Year,
		"otInputs":  result.OTInputs,
		"pay":       pay,
		"updatedAt": savedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

type SaveOTRequest struct {
	Year     int                `json:"year"`
	MonthIdx int                `json:"monthIdx"`
	OTInputs worktime.OTInputMap `json:"otInputs"`
}

func (s *Server) handleSaveOT(w http.ResponseWriter, r *http.Request) {
	var req SaveOTRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Year < 2000 || req.MonthIdx < 0 || req.MonthIdx > 11 {
		http.Error(w, "Invalid year or monthIdx", http.StatusBadRequest)
		return
	}

	updatedAt, err := s.repo.SaveOTData(req.Year, req.MonthIdx, req.OTInputs)
	if err != nil {
		http.Error(w, "Failed to persist OT data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"updatedAt": updatedAt,
	})
}

func (s *Server) handleLoadOT(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("monthIdx")
	year, err1 := strconv.Atoi(yearStr)
	monthIdx, err2 := strconv.Atoi(monthStr)

	if err1 != nil || err2 != nil {
		http.Error(w, "Parameters 'year' and 'monthIdx' are required and must be integers", http.StatusBadRequest)
		return
	}

	otInputs, updatedAt, err := s.repo.LoadOTData(year, monthIdx)
	if err != nil {
		http.Error(w, "Failed to load OT data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"otInputs":  otInputs,
		"updatedAt": updatedAt,
	})
}

func (s *Server) handleGetPay(w http.ResponseWriter, r *http.Request) {
	pay, err := s.repo.LoadPaySettings()
	if err != nil {
		http.Error(w, "Failed to load pay settings: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pay)
}

func (s *Server) handleSavePay(w http.ResponseWriter, r *http.Request) {
	var settings worktime.PaySettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.repo.SavePaySettings(settings); err != nil {
		http.Error(w, "Failed to save pay settings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

type ExportRequest struct {
	Data     []worktime.WorkDay  `json:"data"`
	OTInputs worktime.OTInputMap `json:"otInputs"`
	MonthIdx int                 `json:"monthIdx"`
	Year     int                 `json:"year"`
	Pay      worktime.PaySettings `json:"pay"`
	IsThai   bool                `json:"isThai"`
}

func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	var req ExportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	filename := fmt.Sprintf("Worktime_%02d_%04d.xlsx", req.MonthIdx+1, req.Year)
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))

	if err := exporter.WriteExcelTo(w, req.Data, req.OTInputs, req.IsThai); err != nil {
		http.Error(w, "Failed to generate Excel file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) handleExportPdf(w http.ResponseWriter, r *http.Request) {
	var req ExportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	filename := fmt.Sprintf("WorkTime_Report_%02d_%04d.pdf", req.MonthIdx+1, req.Year)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", filename))

	if err := exporter.WritePdfTo(w, req.Data, req.OTInputs, req.MonthIdx, req.Year, req.Pay, req.IsThai); err != nil {
		http.Error(w, "Failed to generate PDF file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
