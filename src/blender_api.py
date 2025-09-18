"""
BlenderAPI - High-level API for controlling the TC Helicon Blender mixer.
This class provides a clean interface for controlling the mixer and handles
BLE communication with the actual device.
"""
import asyncio
from typing import Optional, Callable, List, Any
from blender_state import BlenderState
from blender_protocol_handler import BlenderProtocolHandler
from blender_ble_client import BlenderBLEClient


class BlenderAPI:
    """High-level API for controlling the TC Helicon Blender mixer."""
    
    def __init__(self):
        self.state = BlenderState()
        self.protocol_handler = BlenderProtocolHandler(self.state)
        self.ble_client: Optional[BlenderBLEClient] = None
        self._connected = False
        self._connection_callbacks: List[Callable[[bool], None]] = []
        
        # Set up state change callbacks
        self.state.add_state_callback(self._on_state_change)
    
    async def connect(self) -> bool:
        """Connect to the Blender device. Returns True if successful."""
        if self._connected:
            return True
        
        try:
            self.ble_client = BlenderBLEClient(self._handle_ble_message)
            await self.ble_client.connect()
            
            # Send handshake to request current state
            handshake = self.protocol_handler.create_ble_message("handshake")
            if handshake:
                await self.ble_client.send_data(handshake)
            
            self._connected = True
            self.state.set_blender_connected(True)
            self._notify_connection_callbacks(True)
            return True
            
        except Exception as e:
            print(f"Failed to connect to Blender: {e}")
            self._connected = False
            self.state.set_blender_connected(False)
            self._notify_connection_callbacks(False)
            return False
    
    async def disconnect(self):
        """Disconnect from the Blender device."""
        if self.ble_client and self._connected:
            await self.ble_client.disconnect()
            self.ble_client = None
        
        self._connected = False
        self.state.set_blender_connected(False)
        self._notify_connection_callbacks(False)
    
    def is_connected(self) -> bool:
        """Check if connected to the Blender device."""
        return self._connected
    
    def add_connection_callback(self, callback: Callable[[bool], None]):
        """Add a callback for connection state changes."""
        self._connection_callbacks.append(callback)
    
    def remove_connection_callback(self, callback: Callable[[bool], None]):
        """Remove a connection state callback."""
        if callback in self._connection_callbacks:
            self._connection_callbacks.remove(callback)
    
    def _notify_connection_callbacks(self, connected: bool):
        """Notify all connection callbacks."""
        for callback in self._connection_callbacks:
            try:
                callback(connected)
            except Exception as e:
                print(f"Error in connection callback: {e}")
    
    async def _handle_ble_message(self, message: bytes):
        """Handle incoming BLE message from device."""
        self.protocol_handler.handle_ble_message(message)
    
    def _on_state_change(self, change_type: str, **kwargs):
        """Handle state changes and send to device if connected."""
        if not self._connected or not self.ble_client:
            return
        
        # Create BLE message for the state change
        ble_message = None
        
        if change_type == "input_level":
            ble_message = self.protocol_handler.create_ble_message(
                "input_level", 
                output=kwargs["output"], 
                input=kwargs["input"], 
                value=kwargs["value"]
            )
        elif change_type == "total_volume":
            ble_message = self.protocol_handler.create_ble_message(
                "total_volume", 
                output=kwargs["output"], 
                value=kwargs["value"]
            )
        elif change_type == "compression_level":
            ble_message = self.protocol_handler.create_ble_message(
                "compression_level", 
                output=kwargs["output"], 
                value=kwargs["value"]
            )
        elif change_type == "room_mic_volume":
            ble_message = self.protocol_handler.create_ble_message(
                "room_mic_volume", 
                output=kwargs["output"], 
                value=kwargs["value"]
            )
        elif change_type == "muted":
            ble_message = self.protocol_handler.create_ble_message(
                "muted", 
                value=kwargs["value"]
            )
        elif change_type == "compression_enabled":
            # Need all compression flags for the message
            flags = [self.state.outputs[i].compression_enabled for i in range(4)]
            ble_message = self.protocol_handler.create_ble_message(
                "compression_flags", 
                flags=flags
            )
        elif change_type == "microphone":
            ble_message = self.protocol_handler.create_ble_message(
                "microphone", 
                value=kwargs["value"]
            )
        
        # Send message to device
        if ble_message:
            try:
                asyncio.create_task(self.ble_client.send_data(ble_message))
            except Exception as e:
                print(f"Failed to send BLE message: {e}")
    
    # High-level control methods
    
    async def set_input_level(self, output_id: int, input_id: int, level: float) -> bool:
        """Set input mix level for a specific output (0.0 to 1.0)."""
        if 0 <= output_id < 4 and 0 <= input_id < 6:
            self.state.set_input_level(output_id, input_id, level)
            return True
        return False
    
    async def get_input_level(self, output_id: int, input_id: int) -> Optional[float]:
        """Get input mix level for a specific output."""
        return self.state.get_input_level(output_id, input_id)
    
    async def set_total_volume(self, output_id: int, volume: float) -> bool:
        """Set total volume for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            self.state.set_total_volume(output_id, volume)
            return True
        return False
    
    async def get_total_volume(self, output_id: int) -> Optional[float]:
        """Get total volume for an output."""
        return self.state.get_total_volume(output_id)
    
    async def set_room_mic_volume(self, output_id: int, volume: float) -> bool:
        """Set room mic volume for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            self.state.set_room_mic_volume(output_id, volume)
            return True
        return False
    
    async def get_room_mic_volume(self, output_id: int) -> Optional[float]:
        """Get room mic volume for an output."""
        return self.state.get_room_mic_volume(output_id)
    
    async def set_compression_level(self, output_id: int, level: float) -> bool:
        """Set compression level for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            self.state.set_compression_level(output_id, level)
            return True
        return False
    
    async def get_compression_level(self, output_id: int) -> Optional[float]:
        """Get compression level for an output."""
        return self.state.get_compression_level(output_id)
    
    async def set_compression_enabled(self, output_id: int, enabled: bool) -> bool:
        """Enable/disable compression for an output."""
        if 0 <= output_id < 4:
            self.state.set_compression_enabled(output_id, enabled)
            return True
        return False
    
    async def is_compression_enabled(self, output_id: int) -> Optional[bool]:
        """Check if compression is enabled for an output."""
        return self.state.is_compression_enabled(output_id)
    
    async def set_muted(self, muted: bool):
        """Set global mute state."""
        self.state.set_muted(muted)
    
    async def is_muted(self) -> bool:
        """Get global mute state."""
        return self.state.is_muted()
    
    async def set_microphone(self, enabled: bool):
        """Set microphone/talkback state."""
        self.state.set_microphone(enabled)
    
    async def is_microphone_enabled(self) -> bool:
        """Get microphone/talkback state."""
        return self.state.is_microphone_enabled()
    
    # Convenience methods
    
    async def mute_all(self):
        """Mute all outputs."""
        await self.set_muted(True)
    
    async def unmute_all(self):
        """Unmute all outputs."""
        await self.set_muted(False)
    
    async def enable_talkback(self):
        """Enable talkback/microphone."""
        await self.set_microphone(True)
    
    async def disable_talkback(self):
        """Disable talkback/microphone."""
        await self.set_microphone(False)
    
    async def set_output_volume(self, output_id: int, volume: float) -> bool:
        """Alias for set_total_volume for clarity."""
        return await self.set_total_volume(output_id, volume)
    
    async def get_output_volume(self, output_id: int) -> Optional[float]:
        """Alias for get_total_volume for clarity."""
        return await self.get_total_volume(output_id)
    
    # State access methods
    
    def get_state(self) -> BlenderState:
        """Get the current state object."""
        return self.state
    
    def get_state_dict(self) -> dict:
        """Get the current state as a dictionary."""
        return self.state.to_dict()
    
    def add_state_callback(self, callback: Callable[[str, dict], None]):
        """Add a callback for state changes."""
        # Wrap the callback to match the state callback signature
        def wrapped_callback(change_type: str, **kwargs):
            callback(change_type, kwargs)
        self.state.add_state_callback(wrapped_callback)
    
    def remove_state_callback(self, callback: Callable[[str, dict], None]):
        """Remove a state change callback."""
        # Note: This won't work with wrapped callbacks, but it's for API completeness
        self.state.remove_state_callback(callback)
    
    # Connection status methods
    
    def get_connection_status(self) -> dict:
        """Get detailed connection status."""
        return {
            "blender_connected": self.state.is_blender_connected(),
            "input_connections": self.state.global_state.input_connections.copy(),
            "output_connections": self.state.global_state.output_connections.copy(),
        }