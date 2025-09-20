# Blender Connector Web Frontend

This is a web frontend for the [Blender Connector](../README.md).

## How to Build

To build the web frontend, you need to have [Node.js](https://nodejs.org/) installed. Then, follow these steps:
1. Navigate to this ([web](.)) directory:
   ```bash
   cd web
   ```
1. Install the dependencies:
   ```bash
   npm install
   ```
1. Build the project:
   ```bash
   npm run build
   ```

## How to Run

### For Development

For use in a development context, there are two debug servers (one for http and one for websockets) that can be started with:
```bash
python3 debug/debug_web_server.py
```
```bash
python3 debug/debug_websocket_server.py
```

Optionally, you can provide a TLS certificate and key to the web server for HTTPS support. To create a self-signed certificate for testing purposes, you can use the following command (before you start the web server):
```bash
openssl req -x509 -nodes -days 90 -newkey rsa:4096 -keyout debug/key.pem -out debug/cert.pem
```

Then, open your web browser and navigate to [`http://localhost:8080`](http://localhost:8080).

### For Production

For production use, adjust the websocket port (and address if necessary) in [main.ts](./source/main.ts):
```typescript
class Main
{
    private static readonly webSocketAddress = window.location.hostname + ":8081";
}
```

Then build the project in release mode:
```bash
npm run build:release
```

Finally, serve the contents of the [`public`](./public/) directory using a web server of your choice (e.g., `nginx`, `Apache`, or a simple Python HTTP server). The html files in [`public/html`](./public/html/) must be served at root level. <br>
For a guide on how to serve static files, consult the documentation of your chosen web server.
