import asyncio
from bleak import BleakClient, BleakScanner

BLENDER_NAME = "Blender"
SERVICE_UUID = "e71ee188-279f-4ed6-8055-12d77bfd900c"
CHAR_UUID = "50e2d021-f23b-46fb-b7e6-fbe12301276a"

async def main():
    print("Scanning for Blender device...")
    devices = await BleakScanner.discover()
    blender = next((d for d in devices if d.name == BLENDER_NAME), None)
    if not blender:
        print("Blender device not found.")
        return

    async with BleakClient(blender.address) as client:
        print(f"Connected to {BLENDER_NAME} ({blender.address})")

        def handle_notify(_, data: bytearray):
            print(f"Received: {data.hex()}")

        await client.start_notify(CHAR_UUID, handle_notify)
        print("Notification handler started. You can now send data.")

        async def send_data(data: bytes):
            await client.write_gatt_char(CHAR_UUID, data)
            print(f"Sent: {data.hex()}")

        # Example: keep running, send test data on user input
        while True:
            user_input = input("Enter hex bytes to send (or 'q' to quit): ")
            if user_input.lower() == "q":
                break
            try:
                data = bytes.fromhex(user_input)
                await send_data(data)
            except Exception as e:
                print(f"Error: {e}")

        await client.stop_notify(CHAR_UUID)
        print("Disconnected.")

if __name__ == "__main__":
    asyncio.run(main())
