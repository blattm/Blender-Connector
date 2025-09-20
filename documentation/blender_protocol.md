# TC Helicon Blender BLE Protocol

This document describes the reverse-engineered BLE protocol of the TC Helicon Blender mixer.

---

## BLE Connection

- **Device Name:** `Blender`
- **Service UUID:** `e71ee188-279f-4ed6-8055-12d77bfd900c`
- **Characteristic UUID:** `50e2d021-f23b-46fb-b7e6-fbe12301276a`
   - This characteristic receives data from the Blender via notify events and allows sending data to the Blender via writes. Reads will not provide any useful data.

---

## Protocol

Messages are always sent as 3-byte commands.

---

### Handshake (Client to Blender)

Client Hello / Request current state: `0x13 0x00 0x00`

Always send this to Blender first, or the connection will stay read-only.

### Per-Output Properties (0x00–0x08) (Bidirectional)

Format for all per-output properties:
`<PropertyID> <OutputNumber> <Value>`

- `<OutputNumber>`: 0–3 (four outputs)
- `<Value>`: volume/compression level (1 byte, full range 0x00-0xFF)
  - Input values are rounded by Blender to 32 discrete levels (see Rounding section below)
  - Stored values: `0x00, 0x08, 0x10, …, 0xF0, 0xFF`

| PropertyID | Name               | Notes                               |
|------------|------------------|-------------------------------------|
| 0x00–0x05  | Input Mix         | 0x00 = Input 0, … 0x05 = Input 5  |
| 0x06       | Total Volume      | Per output                         |
| 0x07       | Compression Level | Per output                         |
| 0x08       | Room Mic Volume   | Per output                         |

---

### Global Properties

#### Mute (0x14) (Bidirectional)

Format: `0x14 0x00 <Value>`

| Value | Meaning       |
|-------|---------------|
| 0x00  | All unmuted   |
| 0x0F  | All muted     |

---

#### Compression Flags (0x15) (Bidirectional)

Format: `0x15 0x00 <Value>`

- `<Value>`: bitmask per output

| Bit | Output |
|-----|--------|
| 3   | Out0   |
| 2   | Out1   |
| 1   | Out2   |
| 0   | Out3   |

---

#### Talkback (0x09) (Bidirectional)

Format: `0x09 0x00 <Value>`

| Value | Meaning        |
|-------|----------------|
| 0x00  | Off            |
| 0x01  | On (all outputs)|

---

#### Connection Flags (0x0B) (Blender to Client)

Format: `0x0B <InputFlags> <OutputFlags>`

- `<InputFlags>`: bitmask for input connections (1 = connected)
  - Bit 0 → Input 0
  - …
  - Bit 5 → Input 5

- `<OutputFlags>`: bitmask for outputs (same scheme as mute/compression)
  - Bit 3 → Output 0
  - Bit 0 → Output 3

---

#### Unknown Properties (Bidirectional)

- **0x0A**: only observed value `0x00 0x00`, purpose unknown
- **0x11**: only observed value `0x00 0x00`, purpose unknown

---

## Value Rounding

The Blender device accepts full 8-bit values (0x00-0xFF) for volume and compression levels, but internally rounds and stores them as 32 discrete levels.

### Rounding Algorithm

The device uses the following rounding function:

```python
def round_value(x: int) -> int:
    if x >= 0xF8:
        return 0xFF
    return (x // 8) * 8
```

This creates the following mapping:
- `0x00-0x07` → `0x00` (step 0)
- `0x08-0x0F` → `0x08` (step 1)
- `0x10-0x17` → `0x10` (step 2)
- ...
- `0xF0-0xF7` → `0xF0` (step 30)
- `0xF8-0xFF` → `0xFF` (step 31/max)

### Practical Implications

- The device accepts any 8-bit input value but only stores 32 possible values
- Values `0xF8` through `0xFF` all map to maximum (`0xFF`)
- All other values are rounded down to the nearest multiple of 8
- This gives 31 evenly-spaced steps (0x00, 0x08, 0x10, ..., 0xF0) plus maximum (0xFF)
- When reading back values via state requests, you will only see the rounded values
