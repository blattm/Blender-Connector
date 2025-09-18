"""
BlenderState - Represents the complete state of the TC Helicon Blender mixer.
This class maintains all mixer properties and provides methods for state updates.
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import IntEnum


class OutputId(IntEnum):
    OUTPUT_0 = 0
    OUTPUT_1 = 1
    OUTPUT_2 = 2
    OUTPUT_3 = 3


class InputId(IntEnum):
    INPUT_0 = 0
    INPUT_1 = 1
    INPUT_2 = 2
    INPUT_3 = 3
    INPUT_4 = 4
    INPUT_5 = 5


@dataclass
class OutputState:
    """State for a single output channel."""
    # Input mix levels (0.0 to 1.0) for each input
    input_levels: List[float] = field(default_factory=lambda: [0.0] * 6)
    # Total volume level (0.0 to 1.0)
    total_volume: float = 0.0
    # Compression level (0.0 to 1.0)
    compression_level: float = 0.0
    # Room mic volume (0.0 to 1.0)  
    room_mic_volume: float = 0.0
    # Whether compression is enabled
    compression_enabled: bool = False


@dataclass
class GlobalState:
    """Global mixer state."""
    # Whether all outputs are muted
    muted: bool = False
    # Whether talkback/microphone is enabled
    microphone: bool = False
    # Input connection status (True = connected)
    input_connections: List[bool] = field(default_factory=lambda: [False] * 6)
    # Output connection status (True = connected)
    output_connections: List[bool] = field(default_factory=lambda: [False] * 4)
    # Whether connected to Blender device
    blender_connected: bool = False


class BlenderState:
    """Complete state representation of the TC Helicon Blender mixer."""
    
    def __init__(self):
        self.outputs: List[OutputState] = [OutputState() for _ in range(4)]
        self.global_state = GlobalState()
        self._state_callbacks: List[callable] = []
    
    def add_state_callback(self, callback: callable):
        """Add a callback that will be called when state changes."""
        self._state_callbacks.append(callback)
    
    def remove_state_callback(self, callback: callable):
        """Remove a state change callback."""
        if callback in self._state_callbacks:
            self._state_callbacks.remove(callback)
    
    def _notify_state_change(self, change_type: str, **kwargs):
        """Notify all callbacks about state changes."""
        for callback in self._state_callbacks:
            try:
                callback(change_type, **kwargs)
            except Exception as e:
                print(f"Error in state callback: {e}")
    
    # Input mix level methods
    def set_input_level(self, output_id: int, input_id: int, level: float):
        """Set input mix level for a specific output (0.0 to 1.0)."""
        if 0 <= output_id < 4 and 0 <= input_id < 6:
            old_level = self.outputs[output_id].input_levels[input_id]
            self.outputs[output_id].input_levels[input_id] = max(0.0, min(1.0, level))
            if old_level != self.outputs[output_id].input_levels[input_id]:
                self._notify_state_change("input_level", output=output_id, input=input_id, 
                                        value=self.outputs[output_id].input_levels[input_id])
    
    def get_input_level(self, output_id: int, input_id: int) -> Optional[float]:
        """Get input mix level for a specific output."""
        if 0 <= output_id < 4 and 0 <= input_id < 6:
            return self.outputs[output_id].input_levels[input_id]
        return None
    
    # Volume methods
    def set_total_volume(self, output_id: int, volume: float):
        """Set total volume for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            old_volume = self.outputs[output_id].total_volume
            self.outputs[output_id].total_volume = max(0.0, min(1.0, volume))
            if old_volume != self.outputs[output_id].total_volume:
                self._notify_state_change("total_volume", output=output_id, 
                                        value=self.outputs[output_id].total_volume)
    
    def get_total_volume(self, output_id: int) -> Optional[float]:
        """Get total volume for an output."""
        if 0 <= output_id < 4:
            return self.outputs[output_id].total_volume
        return None
    
    def set_room_mic_volume(self, output_id: int, volume: float):
        """Set room mic volume for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            old_volume = self.outputs[output_id].room_mic_volume
            self.outputs[output_id].room_mic_volume = max(0.0, min(1.0, volume))
            if old_volume != self.outputs[output_id].room_mic_volume:
                self._notify_state_change("room_mic_volume", output=output_id, 
                                        value=self.outputs[output_id].room_mic_volume)
    
    def get_room_mic_volume(self, output_id: int) -> Optional[float]:
        """Get room mic volume for an output."""
        if 0 <= output_id < 4:
            return self.outputs[output_id].room_mic_volume
        return None
    
    # Compression methods
    def set_compression_level(self, output_id: int, level: float):
        """Set compression level for an output (0.0 to 1.0)."""
        if 0 <= output_id < 4:
            old_level = self.outputs[output_id].compression_level
            self.outputs[output_id].compression_level = max(0.0, min(1.0, level))
            if old_level != self.outputs[output_id].compression_level:
                self._notify_state_change("compression_level", output=output_id, 
                                        value=self.outputs[output_id].compression_level)
    
    def get_compression_level(self, output_id: int) -> Optional[float]:
        """Get compression level for an output."""
        if 0 <= output_id < 4:
            return self.outputs[output_id].compression_level
        return None
    
    def set_compression_enabled(self, output_id: int, enabled: bool):
        """Enable/disable compression for an output."""
        if 0 <= output_id < 4:
            old_enabled = self.outputs[output_id].compression_enabled
            self.outputs[output_id].compression_enabled = enabled
            if old_enabled != self.outputs[output_id].compression_enabled:
                self._notify_state_change("compression_enabled", output=output_id, 
                                        value=self.outputs[output_id].compression_enabled)
    
    def is_compression_enabled(self, output_id: int) -> Optional[bool]:
        """Check if compression is enabled for an output."""
        if 0 <= output_id < 4:
            return self.outputs[output_id].compression_enabled
        return None
    
    # Global state methods
    def set_muted(self, muted: bool):
        """Set global mute state."""
        old_muted = self.global_state.muted
        self.global_state.muted = muted
        if old_muted != self.global_state.muted:
            self._notify_state_change("muted", value=self.global_state.muted)
    
    def is_muted(self) -> bool:
        """Get global mute state."""
        return self.global_state.muted
    
    def set_microphone(self, enabled: bool):
        """Set microphone/talkback state."""
        old_enabled = self.global_state.microphone
        self.global_state.microphone = enabled
        if old_enabled != self.global_state.microphone:
            self._notify_state_change("microphone", value=self.global_state.microphone)
    
    def is_microphone_enabled(self) -> bool:
        """Get microphone/talkback state."""
        return self.global_state.microphone
    
    # Connection state methods
    def set_input_connection(self, input_id: int, connected: bool):
        """Set input connection state."""
        if 0 <= input_id < 6:
            old_connected = self.global_state.input_connections[input_id]
            self.global_state.input_connections[input_id] = connected
            if old_connected != self.global_state.input_connections[input_id]:
                self._notify_state_change("input_connection", input=input_id, 
                                        value=self.global_state.input_connections[input_id])
    
    def is_input_connected(self, input_id: int) -> Optional[bool]:
        """Get input connection state."""
        if 0 <= input_id < 6:
            return self.global_state.input_connections[input_id]
        return None
    
    def set_output_connection(self, output_id: int, connected: bool):
        """Set output connection state."""
        if 0 <= output_id < 4:
            old_connected = self.global_state.output_connections[output_id]
            self.global_state.output_connections[output_id] = connected
            if old_connected != self.global_state.output_connections[output_id]:
                self._notify_state_change("output_connection", output=output_id, 
                                        value=self.global_state.output_connections[output_id])
    
    def is_output_connected(self, output_id: int) -> Optional[bool]:
        """Get output connection state."""
        if 0 <= output_id < 4:
            return self.global_state.output_connections[output_id]
        return None
    
    def set_blender_connected(self, connected: bool):
        """Set Blender device connection state."""
        old_connected = self.global_state.blender_connected
        self.global_state.blender_connected = connected
        if old_connected != self.global_state.blender_connected:
            self._notify_state_change("blender_connected", value=self.global_state.blender_connected)
    
    def is_blender_connected(self) -> bool:
        """Get Blender device connection state."""
        return self.global_state.blender_connected
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert state to dictionary for serialization."""
        return {
            "outputs": [
                {
                    "input_levels": output.input_levels,
                    "total_volume": output.total_volume,
                    "compression_level": output.compression_level,
                    "room_mic_volume": output.room_mic_volume,
                    "compression_enabled": output.compression_enabled,
                }
                for output in self.outputs
            ],
            "global": {
                "muted": self.global_state.muted,
                "microphone": self.global_state.microphone,
                "input_connections": self.global_state.input_connections,
                "output_connections": self.global_state.output_connections,
                "blender_connected": self.global_state.blender_connected,
            }
        }