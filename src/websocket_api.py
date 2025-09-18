"""
WebSocketAPI - WebSocket server that implements the web protocol for Blender control.
This server allows web clients to connect and control the Blender mixer.
"""
import asyncio
import json
import websockets
from typing import Set, Dict, Any, Optional
from blender_api import BlenderAPI


class WebSocketAPI:
    """WebSocket server implementing the web protocol for Blender control."""
    
    def __init__(self, blender_api: BlenderAPI, host: str = "localhost", port: int = 8081):
        self.blender_api = blender_api
        self.host = host
        self.port = port
        self.clients: Set[websockets.ServerConnection] = set()
        self._server = None
        self._running = False
        
        # Set up callbacks
        self.blender_api.add_state_callback(self._on_state_change)
        self.blender_api.add_connection_callback(self._on_connection_change)
    
    async def start(self):
        """Start the WebSocket server."""
        if self._running:
            return
        
        self._server = await websockets.serve(
            self._handle_client,
            self.host,
            self.port
        )
        self._running = True
        print(f"WebSocket API server started at ws://{self.host}:{self.port}")
    
    async def stop(self):
        """Stop the WebSocket server."""
        if not self._running:
            return
        
        if self._server:
            self._server.close()
            await self._server.wait_closed()
        
        # Close all client connections
        if self.clients:
            await asyncio.gather(
                *[client.close() for client in self.clients],
                return_exceptions=True
            )
        
        self._running = False
        print("WebSocket API server stopped")
    
    async def _handle_client(self, websocket: websockets.ServerConnection):
        """Handle a new WebSocket client connection."""
        print(f"Client connected: {websocket.remote_address}")
        self.clients.add(websocket)
        
        try:
            # Send initial state to the new client
            await self._send_initial_state(websocket)
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self._handle_client_message(websocket, data)
                except json.JSONDecodeError as e:
                    await self._send_error(websocket, f"Invalid JSON: {e}")
                except Exception as e:
                    await self._send_error(websocket, f"Error processing message: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"Error handling client: {e}")
        finally:
            self.clients.discard(websocket)
            print(f"Client disconnected: {websocket.remote_address}")
    
    async def _send_initial_state(self, websocket: websockets.ServerConnection):
        """Send the complete current state to a newly connected client."""
        state = self.blender_api.get_state_dict()
        
        # Build the state message according to the web protocol
        bundles = []
        
        # Global state bundle
        global_data = [
            {"key": "muted", "value": state["global"]["muted"]},
            {"key": "microphone", "value": state["global"]["microphone"]}
        ]
        bundles.append({
            "scope": "global",
            "data": global_data
        })
        
        # Output state bundles
        for output_id in range(4):
            output_state = state["outputs"][output_id]
            output_data = []
            
            # Input levels
            for input_id in range(6):
                output_data.append({
                    "key": {"type": "input", "id": input_id},
                    "value": output_state["input_levels"][input_id]
                })
            
            # Other output properties
            output_data.extend([
                {"key": "microphone_volume", "value": output_state["room_mic_volume"]},
                {"key": "sound_volume", "value": output_state["total_volume"]},
                {"key": "compressor_state", "value": output_state["compression_enabled"]},
                {"key": "compressor_value", "value": output_state["compression_level"]}
            ])
            
            bundles.append({
                "scope": {"type": "output", "id": output_id},
                "data": output_data
            })
        
        # Connection state bundle
        connection_data = []
        
        # Output connections
        for output_id in range(4):
            connection_data.append({
                "key": {"type": "output", "id": output_id},
                "value": state["global"]["output_connections"][output_id]
            })
        
        # Input connections
        for input_id in range(6):
            connection_data.append({
                "key": {"type": "input", "id": input_id},
                "value": state["global"]["input_connections"][input_id]
            })
        
        # Blender connection
        connection_data.append({
            "key": "blender",
            "value": state["global"]["blender_connected"]
        })
        
        bundles.append({
            "scope": "connection",
            "data": connection_data
        })
        
        # Send state message
        state_message = {
            "method": "state",
            "bundles": bundles
        }
        
        await websocket.send(json.dumps(state_message))
    
    async def _handle_client_message(self, websocket: websockets.ServerConnection, data: Dict[str, Any]):
        """Handle an incoming message from a client."""
        if not isinstance(data, dict):
            await self._send_error(websocket, "Message must be a JSON object")
            return
        
        method = data.get("method")
        if method != "set":
            await self._send_error(websocket, f"Unsupported method: {method}")
            return
        
        scope = data.get("scope")
        key = data.get("key")
        value = data.get("value")
        
        if scope is None or key is None or value is None:
            await self._send_error(websocket, "Missing required fields: scope, key, value")
            return
        
        try:
            await self._process_set_command(scope, key, value)
        except Exception as e:
            await self._send_error(websocket, f"Error processing command: {e}")
    
    async def _process_set_command(self, scope, key, value):
        """Process a set command and update the Blender state."""
        
        # Global scope
        if scope == "global":
            if key == "muted":
                await self.blender_api.set_muted(bool(value))
            elif key == "microphone":
                await self.blender_api.set_microphone(bool(value))
            else:
                raise ValueError(f"Unknown global key: {key}")
        
        # Output scope
        elif isinstance(scope, dict) and scope.get("type") == "output":
            output_id = scope.get("id")
            if not isinstance(output_id, int) or not (0 <= output_id < 4):
                raise ValueError(f"Invalid output id: {output_id}")
            
            if key == "sound_volume":
                await self.blender_api.set_total_volume(output_id, float(value))
            elif key == "microphone_volume":
                await self.blender_api.set_room_mic_volume(output_id, float(value))
            elif key == "compressor_state":
                await self.blender_api.set_compression_enabled(output_id, bool(value))
            elif key == "compressor_value":
                await self.blender_api.set_compression_level(output_id, float(value))
            elif isinstance(key, dict) and key.get("type") == "input":
                input_id = key.get("id")
                if not isinstance(input_id, int) or not (0 <= input_id < 6):
                    raise ValueError(f"Invalid input id: {input_id}")
                await self.blender_api.set_input_level(output_id, input_id, float(value))
            else:
                raise ValueError(f"Unknown output key: {key}")
        
        else:
            raise ValueError(f"Unknown scope: {scope}")
    
    async def _send_error(self, websocket: websockets.ServerConnection, error_message: str):
        """Send an error message to a client."""
        error_msg = {
            "method": "error",
            "message": error_message
        }
        try:
            await websocket.send(json.dumps(error_msg))
        except Exception:
            pass  # Client might have disconnected
    
    def _on_state_change(self, change_type: str, kwargs: dict):
        """Handle state changes and notify all connected clients."""
        if not self.clients:
            return
        
        # Create notification message based on change type
        notification = self._create_notification(change_type, kwargs)
        if notification:
            # Send to all clients
            asyncio.create_task(self._broadcast_message(notification))
    
    def _create_notification(self, change_type: str, kwargs: dict) -> Optional[dict]:
        """Create a notification message for a state change."""
        
        if change_type == "input_level":
            return {
                "method": "notify",
                "scope": {"type": "output", "id": kwargs["output"]},
                "key": {"type": "input", "id": kwargs["input"]},
                "value": kwargs["value"]
            }
        
        elif change_type == "total_volume":
            return {
                "method": "notify",
                "scope": {"type": "output", "id": kwargs["output"]},
                "key": "sound_volume",
                "value": kwargs["value"]
            }
        
        elif change_type == "room_mic_volume":
            return {
                "method": "notify",
                "scope": {"type": "output", "id": kwargs["output"]},
                "key": "microphone_volume",
                "value": kwargs["value"]
            }
        
        elif change_type == "compression_level":
            return {
                "method": "notify",
                "scope": {"type": "output", "id": kwargs["output"]},
                "key": "compressor_value",
                "value": kwargs["value"]
            }
        
        elif change_type == "compression_enabled":
            return {
                "method": "notify",
                "scope": {"type": "output", "id": kwargs["output"]},
                "key": "compressor_state",
                "value": kwargs["value"]
            }
        
        elif change_type == "muted":
            return {
                "method": "notify",
                "scope": "global",
                "key": "muted",
                "value": kwargs["value"]
            }
        
        elif change_type == "microphone":
            return {
                "method": "notify",
                "scope": "global",
                "key": "microphone",
                "value": kwargs["value"]
            }
        
        elif change_type == "input_connection":
            return {
                "method": "notify",
                "scope": "connection",
                "key": {"type": "input", "id": kwargs["input"]},
                "value": kwargs["value"]
            }
        
        elif change_type == "output_connection":
            return {
                "method": "notify",
                "scope": "connection",
                "key": {"type": "output", "id": kwargs["output"]},
                "value": kwargs["value"]
            }
        
        elif change_type == "blender_connected":
            return {
                "method": "notify",
                "scope": "connection",
                "key": "blender",
                "value": kwargs["value"]
            }
        
        return None
    
    def _on_connection_change(self, connected: bool):
        """Handle Blender connection state changes."""
        if not self.clients:
            return
        
        notification = {
            "method": "notify",
            "scope": "connection",
            "key": "blender",
            "value": connected
        }
        
        asyncio.create_task(self._broadcast_message(notification))
    
    async def _broadcast_message(self, message: dict):
        """Broadcast a message to all connected clients."""
        if not self.clients:
            return
        
        message_json = json.dumps(message)
        
        # Send to all clients, removing disconnected ones
        disconnected = set()
        
        for client in self.clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                print(f"Error sending to client: {e}")
                disconnected.add(client)
        
        # Remove disconnected clients
        self.clients -= disconnected
    
    def get_client_count(self) -> int:
        """Get the number of connected clients."""
        return len(self.clients)
    
    def is_running(self) -> bool:
        """Check if the server is running."""
        return self._running