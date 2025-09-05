#!/usr/bin/env python3

"""
A simple WebSocket server that can be used to test the web frontend.
It listens for incoming connections, prints received messages and can send JSON messages from files to all connected clients.

To send a JSON message, type the name of the JSON file (without the ".json" extension) located in the "websocket_messages"
folder and press Enter.
"""

import asyncio
import json
import os
import websockets

HOST_NAME = "localhost"
SERVER_PORT = 8081

class WebSocketServer:
    _client_id_counter: int
    _clients: set[websockets.ServerConnection]
    _stop_signal: asyncio.Future[bool]

    def __init__ (self):
        self._client_id_counter = 1
        self._clients = set()
        self._stop_signal = asyncio.Future()

    async def start (self):
        self._stop_signal = asyncio.Future()
        async with websockets.serve(self._handle_client, HOST_NAME, SERVER_PORT):
            await self._stop_signal

    def stop (self):
        if not self._stop_signal.done():
            self._stop_signal.set_result(True)

    async def _handle_client (self, websocket: websockets.ServerConnection):
        client_id = self._client_id_counter
        self._client_id_counter += 1

        try:
            self._clients.add(websocket)
            print(f"{client_id}: Connected.")

            async for message in websocket:
                data = json.loads(message)
                pretty_json = json.dumps(data, indent=4)
                print(f"{client_id}:\n{pretty_json}")

        finally:
            self._clients.remove(websocket)
            print(f"{client_id}: Disconnected.")

    async def send_message (self, message: str):
        tasks = []

        for websocket in self._clients:
            tasks.append(websocket.send(message))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_json_file (self, file_path: str):
        with open(file_path, "r") as file:
            data = json.load(file)
            message = json.dumps(data)
            await self.send_message(message)

if __name__ == "__main__":
    try:
        asyncio.set_event_loop(asyncio.new_event_loop())

        server = WebSocketServer()
        asyncio.get_event_loop().run_in_executor(None, asyncio.run, server.start())

        print(f"Server started at ws://{HOST_NAME}:{SERVER_PORT}")

        while True:
            file_name = input()
            file_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "websocket_messages",
                file_name + ".json"
            )
            try:
                asyncio.run(server.send_json_file(file_path))
            except Exception as exception:
                print(f"Error sending file: {exception}")
    except KeyboardInterrupt:
        pass

    server.stop()
    # TODO: Stop the event loop (and asyncio) properly. However that is supposed to work.
    print("Server stopped.")
