"""
BlenderProtocolHandler - Handles conversion between BLE protocol messages and BlenderState.
This class implements the protocol logic documented in documentation/blender_protocol.md
"""
from typing import Optional, List, Tuple
from blender_state import BlenderState


class BlenderProtocolHandler:
    """Handles conversion between BLE protocol messages and BlenderState."""
    
    def __init__(self, state: BlenderState):
        self.state = state
    
    def ble_to_normalized_value(self, ble_value: int) -> float:
        """Convert BLE value (0x00-0xFF) to normalized float (0.0-1.0)."""
        if ble_value == 0xFF:
            return 1.0
        # BLE uses discrete steps: 0x00, 0x08, 0x10, ..., 0xF8 (32 steps)
        # Normalize to 0.0-1.0 range
        return min(1.0, ble_value / 248.0)  # 248 = 0xF8
    
    def normalized_to_ble_value(self, normalized: float) -> int:
        """Convert normalized float (0.0-1.0) to BLE value (0x00-0xFF)."""
        if normalized >= 1.0:
            return 0xFF
        if normalized <= 0.0:
            return 0x00
        # Convert to discrete BLE steps
        step = int(normalized * 31)  # 31 steps from 0 to 31
        return min(0xF8, step * 8)
    
    def parse_ble_message(self, message: bytes) -> Optional[Tuple[str, dict]]:
        """
        Parse a 3-byte BLE message and return (message_type, data).
        Returns None if message cannot be parsed.
        """
        if len(message) != 3:
            return None
        
        property_id = message[0]
        byte1 = message[1]
        byte2 = message[2]
        
        # Handshake
        if property_id == 0x13 and byte1 == 0x00 and byte2 == 0x00:
            return ("handshake", {})
        
        # Per-output properties (0x00-0x08)
        if 0x00 <= property_id <= 0x08:
            output_id = byte1
            if output_id > 3:  # Only 4 outputs
                return None
            
            value = self.ble_to_normalized_value(byte2)
            
            if 0x00 <= property_id <= 0x05:
                # Input mix levels
                input_id = property_id
                return ("input_level", {
                    "output": output_id,
                    "input": input_id,
                    "value": value
                })
            elif property_id == 0x06:
                # Total volume
                return ("total_volume", {
                    "output": output_id,
                    "value": value
                })
            elif property_id == 0x07:
                # Compression level
                return ("compression_level", {
                    "output": output_id,
                    "value": value
                })
            elif property_id == 0x08:
                # Room mic volume
                return ("room_mic_volume", {
                    "output": output_id,
                    "value": value
                })
        
        # Global properties
        if property_id == 0x14 and byte1 == 0x00:
            # Mute state
            muted = byte2 == 0x0F
            return ("muted", {"value": muted})
        
        if property_id == 0x15 and byte1 == 0x00:
            # Compression flags (bitmask)
            compression_flags = []
            for i in range(4):
                bit_pos = 3 - i  # Bit 3 = Output 0, Bit 0 = Output 3
                enabled = bool(byte2 & (1 << bit_pos))
                compression_flags.append(enabled)
            return ("compression_flags", {"flags": compression_flags})
        
        if property_id == 0x09 and byte1 == 0x00:
            # Talkback/microphone
            enabled = byte2 == 0x01
            return ("microphone", {"value": enabled})
        
        if property_id == 0x0B:
            # Connection flags
            input_flags = byte1
            output_flags = byte2
            
            input_connections = []
            for i in range(6):
                connected = bool(input_flags & (1 << i))
                input_connections.append(connected)
            
            output_connections = []
            for i in range(4):
                bit_pos = 3 - i  # Bit 3 = Output 0, Bit 0 = Output 3
                connected = bool(output_flags & (1 << bit_pos))
                output_connections.append(connected)
            
            return ("connection_flags", {
                "input_connections": input_connections,
                "output_connections": output_connections
            })
        
        # Unknown properties - we log but don't process
        if property_id in [0x0A, 0x11]:
            return ("unknown", {"property_id": property_id, "data": [byte1, byte2]})
        
        return None
    
    def handle_ble_message(self, message: bytes):
        """Parse BLE message and update state accordingly."""
        parsed = self.parse_ble_message(message)
        if not parsed:
            print(f"Unknown BLE message: {message.hex()}")
            return
        
        message_type, data = parsed
        
        if message_type == "handshake":
            # Handshake received - this is usually sent by clients
            pass
        
        elif message_type == "input_level":
            self.state.set_input_level(data["output"], data["input"], data["value"])
        
        elif message_type == "total_volume":
            self.state.set_total_volume(data["output"], data["value"])
        
        elif message_type == "compression_level":
            self.state.set_compression_level(data["output"], data["value"])
        
        elif message_type == "room_mic_volume":
            self.state.set_room_mic_volume(data["output"], data["value"])
        
        elif message_type == "muted":
            self.state.set_muted(data["value"])
        
        elif message_type == "compression_flags":
            for output_id, enabled in enumerate(data["flags"]):
                self.state.set_compression_enabled(output_id, enabled)
        
        elif message_type == "microphone":
            self.state.set_microphone(data["value"])
        
        elif message_type == "connection_flags":
            for input_id, connected in enumerate(data["input_connections"]):
                self.state.set_input_connection(input_id, connected)
            for output_id, connected in enumerate(data["output_connections"]):
                self.state.set_output_connection(output_id, connected)
        
        elif message_type == "unknown":
            print(f"Unknown property 0x{data['property_id']:02X}: {data['data']}")
    
    def create_ble_message(self, message_type: str, **kwargs) -> Optional[bytes]:
        """Create a BLE message from high-level parameters."""
        
        if message_type == "handshake":
            return bytes([0x13, 0x00, 0x00])
        
        elif message_type == "input_level":
            output = kwargs["output"]
            input_id = kwargs["input"]
            value = kwargs["value"]
            if 0 <= output <= 3 and 0 <= input_id <= 5:
                ble_value = self.normalized_to_ble_value(value)
                return bytes([input_id, output, ble_value])
        
        elif message_type == "total_volume":
            output = kwargs["output"]
            value = kwargs["value"]
            if 0 <= output <= 3:
                ble_value = self.normalized_to_ble_value(value)
                return bytes([0x06, output, ble_value])
        
        elif message_type == "compression_level":
            output = kwargs["output"]
            value = kwargs["value"]
            if 0 <= output <= 3:
                ble_value = self.normalized_to_ble_value(value)
                return bytes([0x07, output, ble_value])
        
        elif message_type == "room_mic_volume":
            output = kwargs["output"]
            value = kwargs["value"]
            if 0 <= output <= 3:
                ble_value = self.normalized_to_ble_value(value)
                return bytes([0x08, output, ble_value])
        
        elif message_type == "muted":
            value = kwargs["value"]
            ble_value = 0x0F if value else 0x00
            return bytes([0x14, 0x00, ble_value])
        
        elif message_type == "compression_flags":
            flags = kwargs["flags"]  # List of 4 booleans
            if len(flags) == 4:
                ble_value = 0
                for i, enabled in enumerate(flags):
                    if enabled:
                        bit_pos = 3 - i  # Bit 3 = Output 0, Bit 0 = Output 3
                        ble_value |= (1 << bit_pos)
                return bytes([0x15, 0x00, ble_value])
        
        elif message_type == "microphone":
            value = kwargs["value"]
            ble_value = 0x01 if value else 0x00
            return bytes([0x09, 0x00, ble_value])
        
        return None
    
    def get_current_state_messages(self) -> List[bytes]:
        """Get all BLE messages that represent the current state."""
        messages = []
        
        # Per-output properties
        for output_id in range(4):
            output = self.state.outputs[output_id]
            
            # Input levels
            for input_id in range(6):
                level = output.input_levels[input_id]
                msg = self.create_ble_message("input_level", 
                                            output=output_id, input=input_id, value=level)
                if msg:
                    messages.append(msg)
            
            # Total volume
            msg = self.create_ble_message("total_volume", 
                                        output=output_id, value=output.total_volume)
            if msg:
                messages.append(msg)
            
            # Compression level
            msg = self.create_ble_message("compression_level", 
                                        output=output_id, value=output.compression_level)
            if msg:
                messages.append(msg)
            
            # Room mic volume
            msg = self.create_ble_message("room_mic_volume", 
                                        output=output_id, value=output.room_mic_volume)
            if msg:
                messages.append(msg)
        
        # Global properties
        msg = self.create_ble_message("muted", value=self.state.global_state.muted)
        if msg:
            messages.append(msg)
        
        compression_flags = [self.state.outputs[i].compression_enabled for i in range(4)]
        msg = self.create_ble_message("compression_flags", flags=compression_flags)
        if msg:
            messages.append(msg)
        
        msg = self.create_ble_message("microphone", value=self.state.global_state.microphone)
        if msg:
            messages.append(msg)
        
        return messages