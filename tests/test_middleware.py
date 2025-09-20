#!/usr/bin/env python3
"""
Test script for the Blender middleware components using pytest.
This script tests the protocol handler and state management without requiring hardware.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

import pytest
from blender_state import BlenderState
from blender_protocol_handler import BlenderProtocolHandler, MessageType


class TestProtocolHandler:
    """Test the protocol handler with sample BLE messages."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.state = BlenderState()
        self.handler = BlenderProtocolHandler(self.state)
    
    def test_handshake_message(self):
        """Test handshake message parsing."""
        handshake_msg = bytes.fromhex("130000")
        parsed = self.handler.parse_ble_message(handshake_msg)
        
        assert parsed is not None
        assert parsed.message_type == MessageType.HANDSHAKE
        assert parsed.data == {}
    
    def test_input_level_message(self):
        """Test input level message parsing and state update."""
        input_level_msg = bytes.fromhex("000180")  # Input 0, Output 0, Level ~50%
        parsed = self.handler.parse_ble_message(input_level_msg)
        
        assert parsed is not None
        assert parsed.message_type == MessageType.INPUT_LEVEL
        assert parsed.data["output"] == 1
        assert parsed.data["input"] == 0
        assert 0.0 <= parsed.data["value"] <= 1.0
        
        # Test state update
        self.handler.handle_ble_message(input_level_msg)
        level = self.state.get_input_level(1, 0)
        assert level is not None
        assert 0.0 <= level <= 1.0
    
    def test_volume_message(self):
        """Test volume message parsing and state update."""
        volume_msg = bytes.fromhex("0601F8")  # Output 1, Volume ~98%
        parsed = self.handler.parse_ble_message(volume_msg)
        
        assert parsed is not None
        assert parsed.message_type == MessageType.TOTAL_VOLUME
        assert parsed.data["output"] == 1
        assert parsed.data["value"] == 1.0  # 0xF8 should map to max
        
        # Test state update
        self.handler.handle_ble_message(volume_msg)
        volume = self.state.get_total_volume(1)
        assert volume == 1.0
    
    def test_mute_message(self):
        """Test mute message parsing and state update."""
        mute_msg = bytes.fromhex("14000F")  # Global mute on
        parsed = self.handler.parse_ble_message(mute_msg)
        
        assert parsed is not None
        assert parsed.message_type == MessageType.MUTED
        assert parsed.data["value"] is True
        
        # Test state update
        self.handler.handle_ble_message(mute_msg)
        muted = self.state.is_muted()
        assert muted is True
    
    def test_ble_message_creation(self):
        """Test creating BLE messages from high-level parameters."""
        # Test input level message creation
        created_msg = self.handler.create_ble_message("input_level", output=0, input=1, value=0.75)
        assert created_msg is not None
        assert len(created_msg) == 3
        
        # Test unmute message creation
        created_mute = self.handler.create_ble_message("muted", value=False)
        assert created_mute is not None
        assert created_mute == bytes.fromhex("140000")
    
    def test_value_conversion(self):
        """Test BLE value conversion functions."""
        # Test edge cases
        assert self.handler.ble_to_normalized_value(0x00) == 0.0
        assert self.handler.ble_to_normalized_value(0xFF) == 1.0
        
        assert self.handler.normalized_to_ble_value(0.0) == 0x00
        assert self.handler.normalized_to_ble_value(1.0) == 0xFF
        
        # Test mid-range values
        mid_ble = self.handler.normalized_to_ble_value(0.5)
        mid_normalized = self.handler.ble_to_normalized_value(mid_ble)
        assert 0.4 <= mid_normalized <= 0.6  # Allow some tolerance for discrete steps


class TestStateManagement:
    """Test the state management functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.state = BlenderState()
    
    def test_initial_state(self):
        """Test initial state values."""
        assert self.state.is_muted() is False
        assert self.state.is_microphone_enabled() is False
        assert self.state.is_blender_connected() is False
    
    def test_state_updates(self):
        """Test state updates."""
        self.state.set_muted(True)
        self.state.set_microphone(True)
        self.state.set_blender_connected(True)
        
        assert self.state.is_muted() is True
        assert self.state.is_microphone_enabled() is True
        assert self.state.is_blender_connected() is True
    
    def test_output_state(self):
        """Test output state management."""
        self.state.set_total_volume(0, 0.7)
        self.state.set_compression_enabled(0, True)
        self.state.set_compression_level(0, 0.5)
        
        assert self.state.get_total_volume(0) == 0.7
        assert self.state.is_compression_enabled(0) is True
        assert self.state.get_compression_level(0) == 0.5
    
    def test_input_levels(self):
        """Test input level management."""
        for input_id in range(6):
            level = 0.1 * (input_id + 1)
            self.state.set_input_level(0, input_id, level)
            assert self.state.get_input_level(0, input_id) == level
    
    def test_state_serialization(self):
        """Test state serialization."""
        # Set some state
        self.state.set_muted(True)
        self.state.set_total_volume(0, 0.8)
        self.state.set_input_level(0, 0, 0.6)
        
        state_dict = self.state.to_dict()
        
        assert "outputs" in state_dict
        assert "global" in state_dict
        assert state_dict["global"]["muted"] is True
        assert state_dict["outputs"][0]["total_volume"] == 0.8
        assert state_dict["outputs"][0]["input_levels"][0] == 0.6
    
    def test_state_callbacks(self):
        """Test state change callbacks."""
        callback_called = []
        
        def test_callback(change_type, **kwargs):
            callback_called.append((change_type, kwargs))
        
        self.state.add_state_callback(test_callback)
        self.state.set_input_level(2, 3, 0.8)  # Should trigger callback
        
        assert len(callback_called) > 0
        assert callback_called[0][0] == "input_level"
        assert callback_called[0][1]["output"] == 2
        assert callback_called[0][1]["input"] == 3
        assert callback_called[0][1]["value"] == 0.8


if __name__ == "__main__":
    pytest.main([__file__, "-v"])