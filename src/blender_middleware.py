"""
BlenderMiddleware - Main middleware server that coordinates all components.
This is the central hub that connects to the Blender device and provides
APIs for web clients, OSC clients, and other protocols.
"""
import asyncio
import signal
import sys
from typing import Optional
from blender_api import BlenderAPI
from websocket_api import WebSocketAPI
from osc_api import OSCAPI


class BlenderMiddleware:
    """Main middleware server that coordinates all Blender API components."""
    
    def __init__(self, 
                 websocket_host: str = "localhost", 
                 websocket_port: int = 8081,
                 osc_host: str = "127.0.0.1",
                 osc_port: int = 8765,
                 auto_connect: bool = True):
        
        self.auto_connect = auto_connect
        self.blender_api = BlenderAPI()
        self.websocket_api = WebSocketAPI(self.blender_api, websocket_host, websocket_port)
        self.osc_api = OSCAPI(self.blender_api, osc_host, osc_port)
        
        self._running = False
        self._connection_retry_task: Optional[asyncio.Task] = None
        
        # Set up connection monitoring
        self.blender_api.add_connection_callback(self._on_blender_connection_change)
    
    async def start(self):
        """Start the middleware server and all APIs."""
        if self._running:
            print("Middleware already running")
            return
        
        print("Starting Blender Middleware...")
        
        # Start API servers
        try:
            await self.websocket_api.start()
            await self.osc_api.start()
            
            self._running = True
            print("API servers started successfully")
            
            # Connect to Blender if auto_connect is enabled
            if self.auto_connect:
                await self._start_connection_monitoring()
            
            print("Blender Middleware started successfully")
            self._print_status()
            
        except Exception as e:
            print(f"Failed to start middleware: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the middleware server and all APIs."""
        if not self._running:
            return
        
        print("Stopping Blender Middleware...")
        
        # Stop connection monitoring
        if self._connection_retry_task:
            self._connection_retry_task.cancel()
            try:
                await self._connection_retry_task
            except asyncio.CancelledError:
                pass
        
        # Disconnect from Blender
        if self.blender_api.is_connected():
            await self.blender_api.disconnect()
        
        # Stop API servers
        await self.websocket_api.stop()
        await self.osc_api.stop()
        
        self._running = False
        print("Blender Middleware stopped")
    
    async def _start_connection_monitoring(self):
        """Start monitoring and maintaining connection to Blender device."""
        self._connection_retry_task = asyncio.create_task(self._connection_monitor_loop())
    
    async def _connection_monitor_loop(self):
        """Monitor connection and retry if disconnected."""
        print("Starting Blender connection monitoring...")
        
        while self._running:
            try:
                if not self.blender_api.is_connected():
                    print("Attempting to connect to Blender device...")
                    success = await self.blender_api.connect()
                    if success:
                        print("Successfully connected to Blender device")
                    else:
                        print("Failed to connect to Blender device, will retry in 5 seconds...")
                        await asyncio.sleep(5)
                        continue
                
                # Wait before next check
                await asyncio.sleep(10)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in connection monitor: {e}")
                await asyncio.sleep(5)
    
    def _on_blender_connection_change(self, connected: bool):
        """Handle Blender connection state changes."""
        if connected:
            print("✓ Blender device connected")
        else:
            print("✗ Blender device disconnected")
    
    async def connect_to_blender(self) -> bool:
        """Manually connect to Blender device."""
        print("Connecting to Blender device...")
        success = await self.blender_api.connect()
        if success:
            print("Successfully connected to Blender device")
        else:
            print("Failed to connect to Blender device")
        return success
    
    async def disconnect_from_blender(self):
        """Manually disconnect from Blender device."""
        print("Disconnecting from Blender device...")
        await self.blender_api.disconnect()
        print("Disconnected from Blender device")
    
    def _print_status(self):
        """Print current status of all components."""
        print("\n" + "="*50)
        print("BLENDER MIDDLEWARE STATUS")
        print("="*50)
        print(f"Middleware Running: {'Yes' if self._running else 'No'}")
        print(f"Blender Connected: {'Yes' if self.blender_api.is_connected() else 'No'}")
        print(f"WebSocket Server: {'Running' if self.websocket_api.is_running() else 'Stopped'}")
        print(f"  - Address: ws://{self.websocket_api.host}:{self.websocket_api.port}")
        print(f"  - Connected Clients: {self.websocket_api.get_client_count()}")
        print(f"OSC Server: {'Running' if self.osc_api.is_running() else 'Stopped'}")
        print(f"  - Address: {self.osc_api.host}:{self.osc_api.port}")
        print(f"  - Registered Clients: {self.osc_api.get_client_count()}")
        print("="*50)
        
        if self._running:
            print("\nAPI Endpoints:")
            print(f"  WebSocket: ws://{self.websocket_api.host}:{self.websocket_api.port}")
            print(f"  OSC: {self.osc_api.host}:{self.osc_api.port}")
            print("\nTo stop: Ctrl+C")
        print("")
    
    def get_status(self) -> dict:
        """Get detailed status information."""
        return {
            "middleware_running": self._running,
            "blender_connected": self.blender_api.is_connected(),
            "websocket": {
                "running": self.websocket_api.is_running(),
                "host": self.websocket_api.host,
                "port": self.websocket_api.port,
                "client_count": self.websocket_api.get_client_count()
            },
            "osc": {
                "running": self.osc_api.is_running(),
                "host": self.osc_api.host,
                "port": self.osc_api.port,
                "client_count": self.osc_api.get_client_count()
            },
            "blender_state": self.blender_api.get_state_dict()
        }
    
    def is_running(self) -> bool:
        """Check if the middleware is running."""
        return self._running


async def main():
    """Main entry point for the middleware server."""
    
    # Create middleware instance
    middleware = BlenderMiddleware(
        websocket_host="localhost",
        websocket_port=8081,
        osc_host="127.0.0.1", 
        osc_port=8765,
        auto_connect=True
    )
    
    # Set up signal handlers for graceful shutdown
    def signal_handler():
        print("\nReceived interrupt signal, shutting down...")
        asyncio.create_task(middleware.stop())
    
    # Register signal handlers
    if sys.platform != "win32":
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, signal_handler)
    
    try:
        # Start the middleware
        await middleware.start()
        
        # Keep running until stopped
        while middleware.is_running():
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await middleware.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Interrupted")
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)