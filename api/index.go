package handler

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"forth-worktime/internal/repository"
	"forth-worktime/internal/server"
)

var (
	srv  *server.Server
	once sync.Once
)

func getHandler() *server.Server {
	once.Do(func() {
		dbPath := os.Getenv("SQLITE_DB_PATH")
		if dbPath == "" {
			dbPath = filepath.Join(os.TempDir(), "worktime.db")
		}

		repo, err := repository.NewSQLiteRepository(dbPath)
		if err != nil {
			log.Printf("[WARN] Failed to open SQLite at %s: %v, falling back to memory DB", dbPath, err)
			repo, err = repository.NewSQLiteRepository(":memory:")
			if err != nil {
				panic(err)
			}
		}
		srv = server.NewServer(repo)
	})
	return srv
}

// Handler is the Vercel Serverless Function entrypoint.
func Handler(w http.ResponseWriter, r *http.Request) {
	getHandler().Handler().ServeHTTP(w, r)
}
