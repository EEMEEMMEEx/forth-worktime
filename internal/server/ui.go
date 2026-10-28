package server

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed templates/index.html
var indexHTML string

//go:embed static/*
var staticFS embed.FS

func staticFileServer() http.Handler {
	sub, err := fs.Sub(staticFS, "static")
	if err != nil {
		panic(err)
	}
	return http.StripPrefix("/static/", http.FileServer(http.FS(sub)))
}
