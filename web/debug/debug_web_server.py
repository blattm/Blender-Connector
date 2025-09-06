#!/usr/bin/env python3

import os
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST_NAME = "localhost"
SERVER_PORT = 8080

class Path:
    file_path: str

    def __init__ (self, path: str):
        if path == "/":
            self.file_path = "/public/html/index.html"
            return

        components = path.split('/')[1:]
        if len(components) == 1:
            self.file_path = f"/public/html/{components[0]}"
            return
        else:
            self.file_path = f"/public{path}"
            return

class DebugWebServer(BaseHTTPRequestHandler):
    """
    A simple HTTP web server for debugging purposes ONLY. It serves the static project files.
    Do not use in production as it is highly insecure!
    """

    def do_GET (self):
        path = Path(self.path)

        content_type = self._get_content_type(path.file_path)
        if content_type is None:
            self.send_response(415)
            self.end_headers()
            return

        global_path = os.path.dirname(os.path.abspath(__file__)) + path.file_path
        # Use the path class to join the paths instead:
        global_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"..{path.file_path}")

        content = self._get_file_content(global_path)
        if content is None:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-type", content_type)
        self.end_headers()
        self.wfile.write(bytes(content, "utf-8"))

    def _get_content_type (self, file_path: str) -> str|None:
        if file_path.endswith('.html'):
            return 'text/html'
        elif file_path.endswith('.css'):
            return 'text/css'
        elif file_path.endswith('.js'):
            return 'application/javascript'
        elif file_path.endswith('.js.map'):
            return 'application/json'
        elif file_path.endswith('.png'):
            return 'image/png'
        elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
            return 'image/jpeg'
        elif file_path.endswith('.svg'):
            return 'image/svg+xml'
        else:
            return None

    def _get_file_content (self, file_path: str) -> str|None:
        try:
            with open(file_path, 'r') as file:
                return file.read()
        except FileNotFoundError:
            return None

if __name__ == "__main__":
    webServer = HTTPServer((HOST_NAME, SERVER_PORT), DebugWebServer)
    print("Server started: http://%s:%s" % (HOST_NAME, SERVER_PORT))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
