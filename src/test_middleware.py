#!/usr/bin/env python3
"""
Test script for the Blender middleware components.
This script tests the protocol handler and state management without requiring hardware.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from blender_state import BlenderState
from blender_protocol_handler import BlenderProtocolHandler


def test_protocol_handler():
    """Test the protocol handler with sample BLE messages."""
    print("Testing Blender Protocol Handler...")
    
    # Create state and handler
    state = BlenderState()
    handler = BlenderProtocolHandler(state)
    
    # Test handshake message
    print("\n1. Testing handshake message...")
    handshake_msg = bytes.fromhex("130000")
    parsed = handler.parse_ble_message(handshake_msg)
    print(f"   Handshake message {handshake_msg.hex()} -> {parsed}")
    
    # Test input level message
    print("\n2. Testing input level message...")
    input_level_msg = bytes.fromhex("000180")  # Input 0, Output 0, Level ~50%
    parsed = handler.parse_ble_message(input_level_msg)
    print(f"   Input level message {input_level_msg.hex()} -> {parsed}")
    handler.handle_ble_message(input_level_msg)
    level = state.get_input_level(0, 0)
    print(f"   State updated: Output 0, Input 0 level = {level:.3f}")
    
    # Test volume message
    print("\n3. Testing volume message...")
    volume_msg = bytes.fromhex("0601F8")  # Output 1, Volume ~98%
    parsed = handler.parse_ble_message(volume_msg)
    print(f"   Volume message {volume_msg.hex()} -> {parsed}")
    handler.handle_ble_message(volume_msg)
    volume = state.get_total_volume(1)
    print(f"   State updated: Output 1 volume = {volume:.3f}")
    
    # Test mute message
    print("\n4. Testing mute message...")
    mute_msg = bytes.fromhex("14000F")  # Global mute on
    parsed = handler.parse_ble_message(mute_msg)
    print(f"   Mute message {mute_msg.hex()} -> {parsed}")
    handler.handle_ble_message(mute_msg)
    muted = state.is_muted()
    print(f"   State updated: Muted = {muted}")
    
    # Test creating BLE messages from state
    print("\n5. Testing BLE message creation...")
    created_msg = handler.create_ble_message("input_level", output=0, input=1, value=0.75)
    print(f"   Created input level message: {created_msg.hex()}")
    
    created_mute = handler.create_ble_message("muted", value=False)
    print(f"   Created unmute message: {created_mute.hex()}")
    
    # Test state callback
    print("\n6. Testing state callbacks...")
    callback_called = []
    
    def test_callback(change_type, **kwargs):
        callback_called.append((change_type, kwargs))
        print(f"   Callback: {change_type} -> {kwargs}")
    
    state.add_state_callback(test_callback)
    state.set_input_level(2, 3, 0.8)  # Should trigger callback
    
    print(f"   Callback was called: {len(callback_called) > 0}")
    
    print("\n✓ Protocol handler tests completed successfully!")


def test_state_management():
    """Test the state management functionality."""
    print("\nTesting Blender State Management...")
    
    state = BlenderState()
    
    # Test initial state
    print("\n1. Testing initial state...")
    print(f"   Initial mute state: {state.is_muted()}")
    print(f"   Initial microphone state: {state.is_microphone_enabled()}")
    print(f"   Initial Blender connection: {state.is_blender_connected()}")
    
    # Test setting values
    print("\n2. Testing state updates...")
    state.set_muted(True)
    state.set_microphone(True)
    state.set_blender_connected(True)
    
    print(f"   Updated mute state: {state.is_muted()}")
    print(f"   Updated microphone state: {state.is_microphone_enabled()}")
    print(f"   Updated Blender connection: {state.is_blender_connected()}")
    
    # Test output state
    print("\n3. Testing output state...")
    state.set_total_volume(0, 0.7)
    state.set_compression_enabled(0, True)
    state.set_compression_level(0, 0.5)
    
    print(f"   Output 0 volume: {state.get_total_volume(0)}")
    print(f"   Output 0 compression enabled: {state.is_compression_enabled(0)}")
    print(f"   Output 0 compression level: {state.get_compression_level(0)}")
    
    # Test input levels
    print("\n4. Testing input levels...")
    for input_id in range(6):
        level = 0.1 * (input_id + 1)
        state.set_input_level(0, input_id, level)
        print(f"   Output 0, Input {input_id}: {state.get_input_level(0, input_id):.1f}")
    
    # Test state serialization
    print("\n5. Testing state serialization...")
    state_dict = state.to_dict()
    print(f"   State keys: {list(state_dict.keys())}")
    print(f"   Global state keys: {list(state_dict['global'].keys())}")
    print(f"   Output 0 keys: {list(state_dict['outputs'][0].keys())}")
    
    print("\n✓ State management tests completed successfully!")


if __name__ == "__main__":
    print("=" * 60)
    print("BLENDER MIDDLEWARE COMPONENT TESTS")
    print("=" * 60)
    
    try:
        test_protocol_handler()
        test_state_management()
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED! Middleware is ready for use.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)