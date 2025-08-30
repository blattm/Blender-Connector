# TC Helicon Blender Connector

A WIP reverse-engineered Linux interface for the TC Helicon Blender mixer, enabling control via desktop apps, web clients, and third-party software.

## Goals

- Provide a **Linux desktop application** to control the Blender.
- Provide a **server** running on Linux that allows multiple clients to connect via a web interface to the same Blender.
- Provide the **protocol specification** so that anyone can build their own third-party apps, software, or integrations.

## Protocol Documentation

The BLE protocol is described in [protocol.md](protocol.md).  

## Todos
- [x] Understand and document protocol 
- [x] Describe BLE connection details
- [ ] Describe bidirectional/unidirectional protocol elements
- [ ] Provide a high-level wrapper around the protocol
- [ ] Linux BLE connection code + protocol wrapper = Linux Blender API
- [ ] Representation of Blender state via object
- [ ] Define an API to connect with web clients
- [ ] Write web client + server

## Legal / Disclaimer

- This project is **not affiliated with TC Helicon** in any way.  
- Use this software and protocol description **at your own risk**.  
- The author is **not responsible** for any damage to your device, loss of functionality, or other issues caused by using this code or protocol information.
