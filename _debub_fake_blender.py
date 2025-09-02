"""
Blender-mimicking BLE server using Bluezero Peripheral pattern
"""
from typing import Callable
from bluezero import peripheral, adapter

BLENDER_NAME = "Blender"
SERVICE_UUID = "e71ee188-279f-4ed6-8055-12d77bfd900c"
CHAR_UUID = "50e2d021-f23b-46fb-b7e6-fbe12301276a"

CONFIG = bytes.fromhex(
    # "000028"
    # "010060"
    # "020098"
    # "030070"
    # "0400a8"
    # "0500c8"
    # "080090"
    # "060058"
    # "070080"
    # "0001a0"
    # "010190"
    # "020190"
    # "030188"
    # "040190"
    # "050180"
    # "080178"
    # "060140"
    # "070178"
    # "000298"
    # "010298"
    # "020298"
    # "030290"
    # "040298"
    # "050288"
    # "080278"
    # "060270"
    # "070270"
    # "000330"
    # "010360"
    # "020378"
    # "030360"
    # "0403b8"
    # "050360"
    # "080310"
    # "0603a0"
    # "070378"
    # "140000"
    # "150000"
    # "090000"
    # "0a0000"
    # "0b0701"
    "110000"
)


class BlenderServer:
    def __init__(self, on_write: Callable[["BlenderServer", bytearray], None]):

        # Get default adapter address
        adapter_address = list(adapter.Adapter.available())[0].address
        self.peripheral = peripheral.Peripheral(adapter_address, local_name=BLENDER_NAME)

        # Wrap user-provided on_write to add internal handling
        def write_handler(value, options):
            if on_write:
                on_write(self, value)

        # Add service
        self.peripheral.add_service(srv_id=1, uuid=SERVICE_UUID, primary=True)
        # Add characteristic
        self.peripheral.add_characteristic(
            srv_id=1,
            chr_id=1,
            uuid=CHAR_UUID,
            value=[],
            notifying=False,
            flags=["write", "notify"],
            read_callback=None,
            write_callback=write_handler,
            notify_callback=None,
        )
        self.characteristic = self.peripheral.characteristics[-1]

    def start(self):
        print(f"Advertising as {BLENDER_NAME} with service {SERVICE_UUID}")
        self.peripheral.publish()

    def notify(self, data: bytes):
        # Get the characteristic we added (last one in list)
        self.characteristic.set_value(data)


if __name__ == "__main__":
    def example_on_write(server:BlenderServer, value:bytearray):
        print(f"Client wrote: {bytes(value).hex()}")
        if value[:3] == bytearray(bytes.fromhex("130000")):
            server.notify(CONFIG)

    server = BlenderServer(on_write=example_on_write)
    server.start()

