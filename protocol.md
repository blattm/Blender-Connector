# TC Helicon Blender BLE Protocol

This document describes the reverse-engineered BLE protocol of the TC Helicon Blender mixer. Messages are always sent as 3-byte commands.

---

## Per-Output Properties (0x00–0x08)

Format for all per-output properties: <PropertyID> <OutputNumber> <Value>

- `<OutputNumber>`: 0–3 (four outputs)  
- `<Value>`: volume/compression level (1 byte)  
  - `0x00, 0x08, 0x10, …, 0xF8` → 32 discrete steps  
  - `0xFF` → max

| PropertyID | Name               | Notes                               |
|------------|------------------|-------------------------------------|
| 0x00–0x05  | Input Mix         | 0x00 = Input 0, … 0x05 = Input 5  |
| 0x06       | Total Volume      | Per output                         |
| 0x07       | Compression Level | Per output                         |
| 0x08       | Room Mic Volume   | Per output                         |

---

## Global Properties

### Mute (0x14)

Format: `14 00 <Value>`

| Value | Meaning       |
|-------|---------------|
| 0x00  | All unmuted   |
| 0x0F  | All muted     |

---

### Compression Flags (0x15)

Format: `15 00 <Value>`

- `<Value>`: bitmask per output

| Bit | Output |
|-----|--------|
| 3   | Out0   |
| 2   | Out1   |
| 1   | Out2   |
| 0   | Out3   |

---

### Talkback (0x09)

Format: `09 00 <Value>`

| Value | Meaning        |
|-------|----------------|
| 0x00  | Off            |
| 0x01  | On (all outputs)|

---

### Connection Flags (0x0B)

Format: `0B <InputFlags> <OutputFlags>`

- `<InputFlags>`: bitmask for input connections (1 = connected)  
  - Bit 0 → Input 0  
  - …  
  - Bit 5 → Input 5

- `<OutputFlags>`: bitmask for outputs (same scheme as mute/compression)  
  - Bit 3 → Output 0  
  - Bit 0 → Output 3

---

### Unknown Properties

- **0x0A**: only observed value `0x00 0x00`, purpose unknown  
- **0x11**: only observed value `0x00 0x00`, purpose unknown
