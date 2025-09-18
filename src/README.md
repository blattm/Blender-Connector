# Blender Middleware

This directory contains the middleware implementation that bridges the TC Helicon Blender BLE protocol and provides APIs for web clients, OSC clients, and other protocols.

## Components

### Core Components

- **`blender_state.py`** - State management for the complete mixer state
- **`blender_protocol_handler.py`** - Converts between BLE protocol messages and state
- **`blender_api.py`** - High-level API for controlling the Blender mixer
- **`blender_middleware.py`** - Main middleware server that coordinates all components

### API Servers

- **`websocket_api.py`** - WebSocket server implementing the web protocol
- **`osc_api.py`** - OSC (Open Sound Control) server for music software integration

### Existing Components

- **`blender_ble_client.py`** - BLE client for connecting to actual Blender hardware
- **`blender_ble_server.py`** - BLE server for testing/simulation

## Features

✅ **Complete State Management**
- Tracks all mixer parameters (volumes, compression, mute, etc.)
- Real-time state synchronization
- Change notifications and callbacks

✅ **BLE Protocol Implementation**
- Full protocol parsing and message creation
- Bidirectional communication support
- Protocol validation and error handling

✅ **WebSocket API**
- Implements the documented web protocol
- JSON-based messaging
- Real-time state updates to connected clients
- Full state synchronization for new clients

✅ **OSC API**
- Music software integration via OSC protocol
- Comprehensive parameter mapping
- Client registration for real-time updates
- Standard OSC address patterns

✅ **Multi-Client Support**
- Multiple WebSocket clients simultaneously
- Multiple OSC clients simultaneously
- Synchronized state across all clients
- Connection management

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Dependencies include:
# - bleak (for BLE communication)
# - websockets (for WebSocket server)
# - python-osc (for OSC server)
```

## Usage

### Running the Middleware

```bash
# Run the complete middleware server
python3 blender_middleware.py
```

This starts:
- WebSocket server on `localhost:8081`
- OSC server on `127.0.0.1:8765`
- Automatic connection to Blender device (if available)

### Testing

```bash
# Run component tests
python3 test_middleware.py

# Run demo (without hardware)
python3 demo_middleware.py
```

### API Examples

#### WebSocket Client

Connect to `ws://localhost:8081` and send JSON messages:

```json
{
    "method": "set",
    "scope": {"type": "output", "id": 0},
    "key": "sound_volume",
    "value": 0.7
}
```

#### OSC Client

Send OSC messages to `127.0.0.1:8765`:

```
/blender/output/0/volume 0.7
/blender/global/mute
/blender/output/1/compressor/enabled 1
```

### Programmatic Usage

```python
from blender_api import BlenderAPI

# Create API instance
api = BlenderAPI()

# Connect to Blender device
await api.connect()

# Control the mixer
await api.set_total_volume(0, 0.8)
await api.set_input_level(0, 0, 0.6)
await api.set_muted(True)

# Get current state
state = api.get_state_dict()
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Web Clients    │    │   OSC Clients    │    │  Other Clients  │
│  (WebSocket)    │    │   (Music SW)     │    │   (Future)      │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
               ┌─────────────────────────────────┐
               │      Blender Middleware         │
               │  ┌─────────────────────────────┐│
               │  │      Blender API            ││
               │  │  ┌─────────────────────────┐││
               │  │  │   Blender State         │││
               │  │  └─────────────────────────┘││
               │  │  ┌─────────────────────────┐││
               │  │  │  Protocol Handler       │││
               │  │  └─────────────────────────┘││
               │  └─────────────────────────────┘│
               └─────────────┬───────────────────┘
                             │
                    ┌─────────────────┐
                    │  Blender Device │
                    │   (BLE/Hardware)│
                    └─────────────────┘
```

## Protocol Support

### BLE Protocol (Hardware)
- Full implementation of the reverse-engineered protocol
- All documented message types supported
- Automatic state synchronization

### Web Protocol (WebSocket)
- JSON-based messaging
- Complete state updates
- Real-time notifications
- Error handling

### OSC Protocol (Music Software)
- Standard OSC address patterns
- Parameter mapping for all controls
- Client registration system
- Bidirectional communication

## Connection Management

The middleware handles connection states automatically:

- **Hardware Connection**: Automatic retry and reconnection
- **Client Connections**: Graceful handling of disconnects
- **State Synchronization**: Consistent state across all clients
- **Error Recovery**: Robust error handling and recovery

## Development

### Adding New Protocols

1. Create a new API server class (similar to `websocket_api.py`)
2. Implement the protocol-specific message handling
3. Use the `BlenderAPI` for state management
4. Add to `BlenderMiddleware` coordination

### Extending Functionality

- State management: Extend `BlenderState` class
- Protocol support: Extend `BlenderProtocolHandler`
- API methods: Extend `BlenderAPI` class

## Status

- ✅ **Core middleware**: Complete and tested
- ✅ **WebSocket API**: Complete and tested
- ✅ **OSC API**: Complete and tested
- ✅ **State management**: Complete and tested
- ✅ **Protocol handling**: Complete and tested
- ✅ **Multi-client support**: Complete and tested
- 🔄 **Hardware testing**: Requires actual Blender device
- 🔄 **Integration testing**: Requires client applications

The middleware is ready for use and provides a complete bridge between the Blender BLE protocol and modern client applications.