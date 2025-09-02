import asyncio
from typing import Callable, Awaitable
from bleak import BleakClient, BleakScanner

BLENDER_NAME = "Blender"
SERVICE_UUID = "e71ee188-279f-4ed6-8055-12d77bfd900c"
CHAR_UUID = "50e2d021-f23b-46fb-b7e6-fbe12301276a"

async def find_blender():
    print("Scanning for Blender device (will scan until found)...")
    while True:
        devices = await BleakScanner.discover()
        blender = next((d for d in devices if d.name == BLENDER_NAME), None)
        if blender:
            return blender.address
        print("Blender device not found. Scanning again in 2 seconds...")
        await asyncio.sleep(2)

class BlenderBLEClient:
    def __init__(self, handle_message: Callable[[bytes], Awaitable[None]]):
        self.handle_message: Callable[[bytes], Awaitable[None]] = handle_message
        self.client: BleakClient | None = None
        self.connected: bool = False

    async def handle_notify(self, _, data: bytearray):
        if len(data) % 3 != 0:
            raise ValueError(f"Received data length {len(data)} is not divisible by 3: {data.hex()}")
        for i in range(0, len(data), 3):
            chunk = bytes(data[i:i+3])
            await self.handle_message(chunk)

    async def connect(self):
        """Keep trying until successfully connected."""
        while not self.connected:
            try:
                blender_address = await find_blender()
                print(f"Found Blender at {blender_address}, connecting...")
                self.client = BleakClient(blender_address)
                await self.client.__aenter__()  # enters context, may timeout
                await self.client.start_notify(CHAR_UUID, self.handle_notify)
                self.connected = True
                print(f"Connected to {BLENDER_NAME} ({blender_address})")
            except (asyncio.TimeoutError, asyncio.CancelledError) as e:
                print(f"Connection failed: {e}. Retrying...")
                # await asyncio.sleep(2)

    async def disconnect(self):
        if self.client and self.connected:
            try:
                await self.client.stop_notify(CHAR_UUID)
            except Exception:
                pass
            await self.client.__aexit__(None, None, None)
            self.connected = False
            print("Disconnected.")

    async def send_data(self, data: bytes):
        if not self.client or not self.connected:
            raise RuntimeError("Not connected to Blender device.")
        await self.client.write_gatt_char(CHAR_UUID, data)
        print(f"Sent: {data.hex()}")




# Example usage:
async def my_notify_handler(data: bytes):
    print(f"Received: {data.hex()}")

async def main():
    blender = BlenderBLEClient(my_notify_handler)
    await blender.connect()
    await blender.send_data(bytes.fromhex("130000"))
    await blender.send_data(bytes.fromhex("000008"))
    await blender.send_data(bytes.fromhex("130000"))
    await asyncio.sleep(10)
    await blender.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
