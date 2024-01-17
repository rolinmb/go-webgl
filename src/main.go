package main

import (
  "fmt"
  "net/http"
)

const (
  PUBLIC = "public"
)

func mainHandler(h http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*") // Allow CORS
    fmt.Println("mainHandler(): * New Client Request:", r.RemoteAddr)
    h.ServeHTTP(w, r)
  })
}

func main() {
  http.Handle("/", mainHandler(http.FileServer(http.Dir(PUBLIC))))
  fmt.Println("main(): Starting local hosting server for go-webgl on localhost:8080")
  http.ListenAndServe(":8080", nil)
}
