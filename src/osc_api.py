"""
OSC_API - OSC (Open Sound Control) server for Blender control.
This server provides OSC endpoints for controlling the Blender mixer.
"""
import asyncio
from typing import List, Any, Optional
from blender_api import BlenderAPI

# We'll use python-osc if available, otherwise provide a stub implementation
try:
    from pythonosc import dispatcher
    from pythonosc import osc_server
    from pythonosc import udp_client
    OSC_AVAILABLE = True
except ImportError:
    OSC_AVAILABLE = False
    print("python-osc not available. OSC support disabled.")


class OSCStub:
    """Stub class when OSC is not available."""
    def __init__(self, *args, **kwargs):
        pass
    
    async def start(self):
        print("OSC not available - install python-osc package")
    
    async def stop(self):
        pass
    
    def is_running(self):
        return False


class OSCAPI:
    """OSC server for Blender control."""
    
    def __init__(self, blender_api: BlenderAPI, host: str = "127.0.0.1", port: int = 8765):
        if not OSC_AVAILABLE:
            self.__class__ = OSCStub
            return
        
        self.blender_api = blender_api
        self.host = host
        self.port = port
        self.server: Optional[osc_server.AsyncIOOSCUDPServer] = None
        self.transport = None
        self.protocol = None
        self._running = False
        self._client_addresses = set()  # Track client addresses for sending updates
        
        # Set up OSC dispatcher
        self.dispatcher = dispatcher.Dispatcher()
        self._setup_osc_handlers()
        
        # Set up callbacks for state changes
        self.blender_api.add_state_callback(self._on_state_change)
        self.blender_api.add_connection_callback(self._on_connection_change)
    
    def _setup_osc_handlers(self):
        """Set up OSC message handlers."""
        
        # Global controls
        self.dispatcher.map("/blender/global/mute", self._handle_global_mute)
        self.dispatcher.map("/blender/global/unmute", self._handle_global_unmute)
        self.dispatcher.map("/blender/global/muted", self._handle_global_muted)
        self.dispatcher.map("/blender/global/microphone", self._handle_global_microphone)
        
        # Output controls
        for output_id in range(4):
            # Volume controls
            self.dispatcher.map(f"/blender/output/{output_id}/volume", 
                              lambda unused_addr, value, oid=output_id: 
                              asyncio.create_task(self._handle_output_volume(oid, value)))
            
            # Room mic controls  
            self.dispatcher.map(f"/blender/output/{output_id}/room_mic", 
                              lambda unused_addr, value, oid=output_id: 
                              asyncio.create_task(self._handle_room_mic_volume(oid, value)))
            
            # Compression controls
            self.dispatcher.map(f"/blender/output/{output_id}/compressor/enabled", 
                              lambda unused_addr, value, oid=output_id: 
                              asyncio.create_task(self._handle_compression_enabled(oid, value)))
            
            self.dispatcher.map(f"/blender/output/{output_id}/compressor/level", 
                              lambda unused_addr, value, oid=output_id: 
                              asyncio.create_task(self._handle_compression_level(oid, value)))
            
            # Input mix controls
            for input_id in range(6):
                self.dispatcher.map(f"/blender/output/{output_id}/input/{input_id}", 
                                  lambda unused_addr, value, oid=output_id, iid=input_id: 
                                  asyncio.create_task(self._handle_input_level(oid, iid, value)))
        
        # Connection status (read-only)
        self.dispatcher.map("/blender/status", self._handle_status_request)
        
        # Client registration for receiving updates
        self.dispatcher.map("/blender/register", self._handle_client_register)
        self.dispatcher.map("/blender/unregister", self._handle_client_unregister)
    
    async def start(self):
        """Start the OSC server."""
        if not OSC_AVAILABLE:
            print("OSC not available - install python-osc package")
            return
        
        if self._running:
            return
        
        self.server = osc_server.AsyncIOOSCUDPServer((self.host, self.port), self.dispatcher, asyncio.get_event_loop())
        self.transport, self.protocol = await self.server.create_serve_endpoint()
        self._running = True
        print(f"OSC API server started at {self.host}:{self.port}")
    
    async def stop(self):
        """Stop the OSC server."""
        if not self._running:
            return
        
        if self.transport:
            self.transport.close()
        
        self._running = False
        print("OSC API server stopped")
    
    # OSC message handlers
    
    def _handle_global_mute(self, unused_addr):
        """Handle global mute command."""
        asyncio.create_task(self.blender_api.set_muted(True))
    
    def _handle_global_unmute(self, unused_addr):
        """Handle global unmute command."""
        asyncio.create_task(self.blender_api.set_muted(False))
    
    def _handle_global_muted(self, unused_addr, value):
        """Handle global muted state command."""
        asyncio.create_task(self.blender_api.set_muted(bool(value)))
    
    def _handle_global_microphone(self, unused_addr, value):
        """Handle global microphone command."""
        asyncio.create_task(self.blender_api.set_microphone(bool(value)))
    
    async def _handle_output_volume(self, output_id: int, value: float):
        """Handle output volume command."""
        await self.blender_api.set_total_volume(output_id, float(value))
    
    async def _handle_room_mic_volume(self, output_id: int, value: float):
        """Handle room mic volume command."""
        await self.blender_api.set_room_mic_volume(output_id, float(value))
    
    async def _handle_compression_enabled(self, output_id: int, value):
        """Handle compression enabled command."""
        await self.blender_api.set_compression_enabled(output_id, bool(value))
    
    async def _handle_compression_level(self, output_id: int, value: float):
        """Handle compression level command."""
        await self.blender_api.set_compression_level(output_id, float(value))
    
    async def _handle_input_level(self, output_id: int, input_id: int, value: float):
        """Handle input level command."""
        await self.blender_api.set_input_level(output_id, input_id, float(value))
    
    def _handle_status_request(self, unused_addr, client_host=None, client_port=None):
        """Handle status request and send current state."""
        if client_host and client_port:
            asyncio.create_task(self._send_full_status(client_host, int(client_port)))
    
    def _handle_client_register(self, unused_addr, client_host, client_port):
        """Register a client for receiving OSC updates."""
        client_addr = (str(client_host), int(client_port))
        self._client_addresses.add(client_addr)
        print(f"OSC client registered: {client_addr}")
        
        # Send current state to new client
        asyncio.create_task(self._send_full_status(client_host, client_port))
    
    def _handle_client_unregister(self, unused_addr, client_host, client_port):
        """Unregister a client from receiving OSC updates."""
        client_addr = (str(client_host), int(client_port))
        self._client_addresses.discard(client_addr)
        print(f"OSC client unregistered: {client_addr}")
    
    # State change handlers
    
    def _on_state_change(self, change_type: str, kwargs: dict):
        """Handle state changes and send OSC updates to registered clients."""
        if not self._client_addresses:
            return
        
        asyncio.create_task(self._broadcast_state_change(change_type, kwargs))
    
    def _on_connection_change(self, connected: bool):
        """Handle connection state changes."""
        if not self._client_addresses:
            return
        
        asyncio.create_task(self._broadcast_connection_status(connected))
    
    async def _broadcast_state_change(self, change_type: str, kwargs: dict):
        """Broadcast state changes to all registered clients."""
        
        for client_host, client_port in self._client_addresses:
            try:
                client = udp_client.SimpleUDPClient(client_host, client_port)
                
                if change_type == "input_level":
                    client.send_message(
                        f"/blender/output/{kwargs['output']}/input/{kwargs['input']}", 
                        kwargs['value']
                    )
                
                elif change_type == "total_volume":
                    client.send_message(
                        f"/blender/output/{kwargs['output']}/volume", 
                        kwargs['value']
                    )
                
                elif change_type == "room_mic_volume":
                    client.send_message(
                        f"/blender/output/{kwargs['output']}/room_mic", 
                        kwargs['value']
                    )
                
                elif change_type == "compression_level":
                    client.send_message(
                        f"/blender/output/{kwargs['output']}/compressor/level", 
                        kwargs['value']
                    )
                
                elif change_type == "compression_enabled":
                    client.send_message(
                        f"/blender/output/{kwargs['output']}/compressor/enabled", 
                        1 if kwargs['value'] else 0
                    )
                
                elif change_type == "muted":
                    client.send_message("/blender/global/muted", 1 if kwargs['value'] else 0)
                
                elif change_type == "microphone":
                    client.send_message("/blender/global/microphone", 1 if kwargs['value'] else 0)
                
            except Exception as e:
                print(f"Error sending OSC to {client_host}:{client_port}: {e}")
                # Remove failed client
                self._client_addresses.discard((client_host, client_port))
    
    async def _broadcast_connection_status(self, connected: bool):
        """Broadcast connection status to all registered clients."""
        
        for client_host, client_port in self._client_addresses:
            try:
                client = udp_client.SimpleUDPClient(client_host, client_port)
                client.send_message("/blender/status/connected", 1 if connected else 0)
            except Exception as e:
                print(f"Error sending OSC to {client_host}:{client_port}: {e}")
                self._client_addresses.discard((client_host, client_port))
    
    async def _send_full_status(self, client_host: str, client_port: int):
        """Send complete current state to a specific client."""
        try:
            client = udp_client.SimpleUDPClient(client_host, client_port)
            state = self.blender_api.get_state_dict()
            
            # Send global state
            client.send_message("/blender/global/muted", 1 if state["global"]["muted"] else 0)
            client.send_message("/blender/global/microphone", 1 if state["global"]["microphone"] else 0)
            
            # Send output states
            for output_id in range(4):
                output_state = state["outputs"][output_id]
                
                client.send_message(f"/blender/output/{output_id}/volume", output_state["total_volume"])
                client.send_message(f"/blender/output/{output_id}/room_mic", output_state["room_mic_volume"])
                client.send_message(f"/blender/output/{output_id}/compressor/enabled", 
                                  1 if output_state["compression_enabled"] else 0)
                client.send_message(f"/blender/output/{output_id}/compressor/level", 
                                  output_state["compression_level"])
                
                # Send input levels
                for input_id in range(6):
                    client.send_message(f"/blender/output/{output_id}/input/{input_id}", 
                                      output_state["input_levels"][input_id])
            
            # Send connection status
            client.send_message("/blender/status/connected", 
                              1 if state["global"]["blender_connected"] else 0)
            
            for input_id in range(6):
                client.send_message(f"/blender/status/input/{input_id}/connected", 
                                  1 if state["global"]["input_connections"][input_id] else 0)
            
            for output_id in range(4):
                client.send_message(f"/blender/status/output/{output_id}/connected", 
                                  1 if state["global"]["output_connections"][output_id] else 0)
        
        except Exception as e:
            print(f"Error sending full status to {client_host}:{client_port}: {e}")
    
    def is_running(self) -> bool:
        """Check if the server is running."""
        return self._running
    
    def get_client_count(self) -> int:
        """Get the number of registered clients."""
        return len(self._client_addresses)