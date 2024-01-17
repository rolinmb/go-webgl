package main

import ( "net/http" )

func corsHandler(h http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    h.ServeHTTP(w, r)
  })
}

func main() {
  http.Handle("/", corsHandler(http.FileServer(http.Dir("public"))))
  http.ListenAndServe(":8080", nil)
}
