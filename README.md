# TC Helicon Blender Connector

A WIP reverse-engineered Linux interface for the TC Helicon Blender mixer, enabling control via desktop apps, web clients, and third-party software.

## Goals

- Provide a **desktop application** to control the Blender.
- Provide a **server** that allows multiple clients to connect via a web interface to the same Blender.
- Provide the **protocol specification** so that anyone can build their own third-party apps, software, or integrations.

## Protocol Documentation

The BLE protocol is described in [documentation/blender_protocol.md](documentation/blender_protocol.md).

The web protocol (our custom JSON protocol for clients) is described in [documentation/web_protocol.md](documentation/web_protocol.md).

## Middleware

A complete middleware implementation is available in the `src/` directory that bridges the Blender BLE protocol and provides APIs for multiple client types.

### Features

- **WebSocket API**: JSON-based web protocol for browser/web applications
- **OSC API**: Open Sound Control protocol for music software integration  
- **High-level API**: Simplified Python API for direct integration
- **Multi-client support**: Multiple clients can connect simultaneously
- **Real-time synchronization**: All clients see consistent state
- **Automatic reconnection**: Handles device disconnection gracefully

### Quick Start

```bash
# Install dependencies
cd src/
pip install -r requirements.txt

# Run the middleware server
python3 blender_middleware.py
```

This starts:
- WebSocket server on `ws://localhost:8081`
- OSC server on `127.0.0.1:8765`
- Automatic connection to Blender device

### API Examples

**WebSocket (JSON):**
```json
{
    "method": "set",
    "scope": {"type": "output", "id": 0},
    "key": "sound_volume",
    "value": 0.7
}
```

**OSC:**
```
/blender/output/0/volume 0.7
/blender/global/mute
```

**Python API:**
```python
from blender_api import BlenderAPI

api = BlenderAPI()
await api.connect()
await api.set_total_volume(0, 0.8)
```

See [src/README.md](src/README.md) for complete documentation.

## Todos
- [x] Understand and document protocol
- [x] Describe BLE connection details
- [x] Describe bidirectional/unidirectional protocol elements
- [x] BLE connection code
- [x] Provide a high-level wrapper around the protocol messages
- [x] Fully functioning Blender API
- [x] Representation of Blender state via object
- [x] BLE Blender Server
- [x] Define an API to connect with (web) clients
- [x] Write web server
- [x] Implement OSC support
- [ ] Implement MIDI support
- [ ] Write web client
- [ ] Customizable channel names

## Legal / Disclaimer

- This project is **not affiliated with TC Helicon** in any way.
- Use this software and protocol description **at your own risk**.
- The author is **not responsible** for any damage to your device, loss of functionality, or other issues caused by using this code or protocol information.
