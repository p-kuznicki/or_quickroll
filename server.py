#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = 8001

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

class Server(ThreadingHTTPServer):
    allow_reuse_address = True

print(f"4E Quick Rolls v0.3: http://localhost:{PORT}/manifest.json")
print("Zatrzymanie serwera: Ctrl+C")
Server(("0.0.0.0", PORT), Handler).serve_forever()
