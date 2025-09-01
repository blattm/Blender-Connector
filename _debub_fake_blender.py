"""
Blender-mimicking BLE server using Bluezero Peripheral pattern
"""
from bluezero import peripheral, adapter

BLENDER_NAME = "Blender"
SERVICE_UUID = "e71ee188-279f-4ed6-8055-12d77bfd900c"
CHAR_UUID = "50e2d021-f23b-46fb-b7e6-fbe12301276a"

received_data = []

def on_write(value, options):
    print(f"Received from client: {bytes(value).hex()}")
    received_data.append(bytes(value))

def main():
    # Get the default adapter address
    adapter_address = list(adapter.Adapter.available())[0].address
    blender = peripheral.Peripheral(adapter_address, local_name=BLENDER_NAME)
    # Add Blender service
    blender.add_service(srv_id=1, uuid=SERVICE_UUID, primary=True)
    # Add Blender characteristic
    blender.add_characteristic(
        srv_id=1,
        chr_id=1,
        uuid=CHAR_UUID,
        value=[],
        notifying=False,
        flags=['write', 'notify'],
        read_callback=None,
        write_callback=on_write,
        notify_callback=None
    )
    print(f"Advertising as {BLENDER_NAME} with service {SERVICE_UUID}")
    blender.publish()

if __name__ == "__main__":
    main()
