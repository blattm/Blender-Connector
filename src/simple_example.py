#!/usr/bin/env python3
"""
Simple usage example for the Blender middleware.
This shows how to use the BlenderAPI programmatically.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from blender_api import BlenderAPI


async def simple_example():
    """Simple example of using the Blender API."""
    print("🎛️  Simple Blender API Example")
    print("=" * 40)
    
    # Create API instance
    api = BlenderAPI()
    
    # Note: In a real scenario, you would connect to hardware:
    # success = await api.connect()
    # if not success:
    #     print("Failed to connect to Blender device")
    #     return
    
    print("🎚️  Setting mixer parameters...")
    
    # Set some mixer parameters
    await api.set_total_volume(0, 0.8)     # Output 0 volume to 80%
    await api.set_input_level(0, 0, 0.6)   # Output 0, Input 0 to 60%
    await api.set_muted(True)              # Mute all outputs
    await api.set_microphone(True)         # Enable talkback
    
    # Read back the values
    volume = await api.get_total_volume(0)
    input_level = await api.get_input_level(0, 0)
    muted = await api.is_muted()
    mic_enabled = await api.is_microphone_enabled()
    
    print(f"   Output 0 volume: {volume:.1%}")
    print(f"   Output 0, Input 0 level: {input_level:.1%}")
    print(f"   Global mute: {'ON' if muted else 'OFF'}")
    print(f"   Microphone: {'ON' if mic_enabled else 'OFF'}")
    
    # Get complete state
    print("\n📊 Complete mixer state:")
    state = api.get_state_dict()
    
    print(f"   Connected to hardware: {state['global']['blender_connected']}")
    print(f"   Total outputs: {len(state['outputs'])}")
    
    for i, output in enumerate(state['outputs']):
        print(f"   Output {i}: Volume={output['total_volume']:.1%}, "
              f"Compression={'ON' if output['compression_enabled'] else 'OFF'}")
    
    print("\n✅ Example completed!")


if __name__ == "__main__":
    asyncio.run(simple_example())