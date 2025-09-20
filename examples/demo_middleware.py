#!/usr/bin/env python3
"""
Demo script for the Blender middleware.
This script demonstrates the middleware functionality in a simulated environment.
"""

import asyncio
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from blender_middleware import BlenderMiddleware


async def demo_middleware():
    """Demonstrate the middleware functionality."""
    print("🎛️  Blender Middleware Demo")
    print("=" * 50)
    
    # Create middleware with auto-connect disabled (no hardware needed)
    middleware = BlenderMiddleware(
        websocket_host="localhost",
        websocket_port=8081,
        osc_host="127.0.0.1",
        osc_port=8765,
        auto_connect=False  # Don't try to connect to hardware
    )
    
    try:
        # Start the middleware
        print("Starting middleware servers...")
        await middleware.start()
        
        # Simulate some state changes
        print("\n📊 Simulating mixer state changes...")
        
        # Get the API instance
        api = middleware.blender_api
        
        # Simulate state changes
        await api.set_muted(True)
        print("   ✓ Set global mute: ON")
        
        await api.set_total_volume(0, 0.8)
        print("   ✓ Set output 0 volume: 0.8")
        
        await api.set_input_level(0, 0, 0.6)
        print("   ✓ Set output 0, input 0 level: 0.6")
        
        await api.set_compression_enabled(1, True)
        print("   ✓ Enabled compression on output 1")
        
        await api.set_microphone(True)
        print("   ✓ Enabled talkback/microphone")
        
        # Show current state
        print("\n📋 Current mixer state:")
        state = api.get_state_dict()
        
        print(f"   Global muted: {state['global']['muted']}")
        print(f"   Microphone enabled: {state['global']['microphone']}")
        print(f"   Blender connected: {state['global']['blender_connected']}")
        
        for i in range(4):
            output = state['outputs'][i]
            print(f"   Output {i}:")
            print(f"     Volume: {output['total_volume']:.2f}")
            print(f"     Compression: {'ON' if output['compression_enabled'] else 'OFF'}")
            print(f"     Input 0 level: {output['input_levels'][0]:.2f}")
        
        # Show server status
        print("\n🌐 Server status:")
        status = middleware.get_status()
        
        ws_info = status['websocket']
        print(f"   WebSocket: {'Running' if ws_info['running'] else 'Stopped'}")
        print(f"     Address: ws://{ws_info['host']}:{ws_info['port']}")
        print(f"     Clients: {ws_info['client_count']}")
        
        osc_info = status['osc']
        print(f"   OSC: {'Running' if osc_info['running'] else 'Stopped'}")
        print(f"     Address: {osc_info['host']}:{osc_info['port']}")
        print(f"     Clients: {osc_info['client_count']}")
        
        print("\n📝 API Usage Examples:")
        print("   WebSocket clients can connect to: ws://localhost:8081")
        print("   OSC clients can send to: 127.0.0.1:8765")
        print()
        print("   WebSocket message example:")
        example_msg = {
            "method": "set",
            "scope": {"type": "output", "id": 0},
            "key": "sound_volume",
            "value": 0.7
        }
        print(f"     {json.dumps(example_msg, indent=6)}")
        print()
        print("   OSC message examples:")
        print("     /blender/output/0/volume 0.7")
        print("     /blender/global/mute")
        print("     /blender/output/1/compressor/enabled 1")
        
        print("\n⏱️  Demo running for 10 seconds...")
        print("   (In a real setup, this would run continuously)")
        print("   Press Ctrl+C to stop early")
        
        # Keep running for demo
        await asyncio.sleep(10)
        
    except KeyboardInterrupt:
        print("\n⏹️  Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\n🛑 Stopping middleware...")
        await middleware.stop()
        print("✓ Demo completed")


if __name__ == "__main__":
    try:
        asyncio.run(demo_middleware())
    except KeyboardInterrupt:
        print("\nDemo interrupted")
    except Exception as e:
        print(f"Demo failed: {e}")
        sys.exit(1)
