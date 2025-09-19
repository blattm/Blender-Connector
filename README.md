# TC Helicon Blender Connector

A WIP reverse-engineered Linux interface for the TC Helicon Blender mixer, enabling control via desktop apps, web clients, and third-party software.

## Goals

- Provide a **desktop application** to control the Blender.
- Provide a **server** that allows multiple clients to connect via a web interface to the same Blender.
- Provide the **protocol specification** so that anyone can build their own third-party apps, software, or integrations.

## Protocol Documentation

The BLE protocol is described in [documentation/blender_protocol.md](documentation/blender_protocol.md).

## Todos
- [x] Understand and document protocol
- [x] Describe BLE connection details
- [x] Describe bidirectional/unidirectional protocol elements
- [x] BLE connection code
- [ ] Provide a high-level wrapper around the protocol messages
- [ ] Fully functioning Blender API
- [ ] Representation of Blender state via object
- [ ] BLE Blender Server
- [x] Define an API to connect with (web) clients
- [x] Write web client
- [ ] Write web server
- [ ] Implement OSC support
- [ ] Implement MIDI support
- [ ] Customizable channel names 

## Legal / Disclaimer

- This project is **not affiliated with TC Helicon** in any way.
- Use this software and protocol description **at your own risk**.
- The author is **not responsible** for any damage to your device, loss of functionality, or other issues caused by using this code or protocol information.
