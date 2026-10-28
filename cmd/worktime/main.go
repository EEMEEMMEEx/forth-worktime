package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"forth-worktime/pkg/exporter"
	"forth-worktime/pkg/parser"
	"forth-worktime/pkg/repository"
	"forth-worktime/pkg/server"
	"forth-worktime/pkg/worktime"
)

func main() {
	defaultPort := 8080
	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil && p > 0 {
			defaultPort = p
		}
	}

	port := flag.Int("port", defaultPort, "HTTP server listening port")
	dbPath := flag.String("db", "worktime.db", "Path to SQLite database file")
	cliParseFile := flag.String("parse", "", "Optional CLI mode: path to a timestatement PDF file to parse directly")
	cliExportFile := flag.String("export", "", "Optional CLI mode: destination path for .xlsx export")
	cliExportPdfFile := flag.String("export-pdf", "", "Optional CLI mode: destination path for .pdf export")
	showVersion := flag.Bool("v", false, "Print version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Printf("WorkTime Analyzer %s\n", worktime.Version)
		return
	}

	fmt.Printf("====================================================\n")
	fmt.Printf("  WorkTime Analyzer %s (Go Standalone Edition)\n", worktime.Version)
	fmt.Printf("====================================================\n")

	// CLI Mode: Parse PDF directly from terminal if -parse is given
	if *cliParseFile != "" {
		runCliMode(*cliParseFile, *cliExportFile, *cliExportPdfFile)
		return
	}

	// Web Server Mode
	absDbPath, err := filepath.Abs(*dbPath)
	if err != nil {
		absDbPath = *dbPath
	}
	fmt.Printf("[INFO] Database: %s\n", absDbPath)

	repo, err := repository.NewSQLiteRepository(absDbPath)
	if err != nil {
		log.Fatalf("[ERROR] Failed to initialize SQLite repository: %v", err)
	}
	defer repo.Close()

	srv := server.NewServer(repo)
	addr := fmt.Sprintf(":%d", *port)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      srv.Handler(),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	// Graceful shutdown channel
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("[INFO] Server listening on http://localhost:%d\n", *port)
		fmt.Printf("[INFO] Press Ctrl+C to stop.\n\n")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[ERROR] HTTP Server error: %v", err)
		}
	}()

	<-stopChan
	fmt.Println("\n[INFO] Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("[WARN] Server shutdown forced: %v", err)
	} else {
		fmt.Println("[INFO] Server stopped cleanly.")
	}
}

func runCliMode(pdfPath, exportPath, exportPdfPath string) {
	fmt.Printf("[CLI] Reading and parsing %s...\n", pdfPath)
	data, err := os.ReadFile(pdfPath)
	if err != nil {
		log.Fatalf("[CLI ERROR] Could not read PDF file: %v", err)
	}

	result, err := parser.AnalyzePDFBytes(data)
	if err != nil {
		log.Fatalf("[CLI ERROR] Parse failed: %v", err)
	}

	fmt.Printf("[CLI] Successfully parsed %d days for Month %02d/%d\n", len(result.Results), result.MonthIdx+1, result.Year)
	var totalNet float64
	for _, d := range result.Results {
		totalNet += d.NetHours
	}
	fmt.Printf("[CLI] Total Net Hours: %.2f hrs across %d days with OT\n", totalNet, len(result.OTInputs))

	if exportPath != "" {
		outFile, err := os.Create(exportPath)
		if err != nil {
			log.Fatalf("[CLI ERROR] Failed to create export file: %v", err)
		}
		defer outFile.Close()

		if err := exporter.WriteExcelTo(outFile, result.Results, result.OTInputs, true); err != nil {
			log.Fatalf("[CLI ERROR] Export failed: %v", err)
		}
		fmt.Printf("[CLI] Excel saved to: %s\n", exportPath)
	}

	if exportPdfPath != "" {
		outPdf, err := os.Create(exportPdfPath)
		if err != nil {
			log.Fatalf("[CLI ERROR] Failed to create PDF export file: %v", err)
		}
		defer outPdf.Close()

		pay := worktime.PaySettings{MonthlySalary: 0, BaseHours: 240}
		if err := exporter.WritePdfTo(outPdf, result.Results, result.OTInputs, result.MonthIdx, result.Year, pay, true); err != nil {
			log.Fatalf("[CLI ERROR] PDF Export failed: %v", err)
		}
		fmt.Printf("[CLI] PDF report saved to: %s\n", exportPdfPath)
	}
}
