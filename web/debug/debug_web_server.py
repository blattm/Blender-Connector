#!/usr/bin/env python3

import os
import ssl
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST_NAME = "0.0.0.0"
SERVER_PORT = 8080

class Path:
    file_path: str

    def __init__ (self, path: str):
        if path == "/":
            self.file_path = "/public/html/index.html"
            return

        components = path.split('/')[1:]
        if len(components) == 1 and components[0].endswith('.html'):
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

        global_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"..{path.file_path}")

        content = self._get_file_content(global_path)
        if content is None:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

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
        elif file_path.endswith('.ico'):
            return 'image/vnd.microsoft.icon'
        elif file_path.endswith('.json'):
            return 'application/json'
        else:
            return None

    def _get_file_content (self, file_path: str) -> bytes|None:
        try:
            with open(file_path, 'rb') as file:
                return file.read()
        except FileNotFoundError:
            return None

if __name__ == "__main__":
    webServer = HTTPServer((HOST_NAME, SERVER_PORT), DebugWebServer)

    protocol = "http"

    certificate_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cert.pem")
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "key.pem")

    if os.path.exists(certificate_path) and os.path.exists(key_path):
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(certificate_path, key_path)
        webServer.socket = ssl_context.wrap_socket(webServer.socket, server_side=True)
        protocol = "https"

    print(f"Server started at: {protocol}://{HOST_NAME}:{SERVER_PORT}")

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
