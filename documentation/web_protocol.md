# Web Protocol

This is a draft.

## Client to Server Messages

Available methods: `set`
Available scopes: `global`, `output` (with id 1-4)
Available keys:
  - For `global` scope: `sound`, `sound_volume`, `microphone`, `microphone_volume`
  - For `output` scope: `input` (with id 1-6), `compressor_state`, `compressor_value`

Global settings:
```json
{"method": "set", "scope": "global", "key": "sound", "value": true}
{"method": "set", "scope": "global", "key": "sound_volume", "value": 0.532}
{"method": "set", "scope": "global", "key": "microphone", "value": true}
{"method": "set", "scope": "global", "key": "microphone_volume", "value": 0.532}
```

Local (output-bound) setting:
```json
{
    "method": "set",
    "scope": {
        "type": "output",
        "id": 1
    },
    "key": "compressor_state",
    "value": true
}
```

Local (output-bound) and input-targeting setting:
```json
{
    "method": "set",
    "scope": {
        "type": "output",
        "id": 1
    },
    "key": {
        "type": "input",
        "id": 1
    },
    "value": 0.532
}
```

## Server to Client Messages

Available methods: `notify`, `state`
Available scopes: `global`, `output` (with id 1-4), `connection`
Available keys:
  - For `global` scope: `sound`, `sound_volume`, `microphone`, `microphone_volume`
  - For `output` scope: `input` (with id 1-6), `compressor_state`, `compressor_value`
  - For `connection` scope: `output` (with id 1-4), `input` (with id 1-6), `blender`

The same form as the client to server message, but with `"method": "notify"` instead of `"method": "set"`.
Additionally the following message form is available:

Complete state update (only sent directly after connection):
```json
{
    "method": "state",
    "scopes": [
        {
            "scope": "global",
            "data": [
                {"key": "sound", "value": true},
                {"key": "sound_volume", "value": 0.532},
                {"key": "microphone", "value": true},
                {"key": "microphone_volume", "value": 0.532}
            ]
        },
        {
            "scope": {"type": "output", "id": 1},
            "data": [
                {"key": {"type": "input", "id": 1}, "value": 0.532},
                {"key": {"type": "input", "id": 2}, "value": 0.532},
                {"key": {"type": "input", "id": 3}, "value": 0.532},
                {"key": {"type": "input", "id": 4}, "value": 0.532},
                {"key": {"type": "input", "id": 5}, "value": 0.532},
                {"key": {"type": "input", "id": 6}, "value": 0.532},
                {"key": "compressor_state", "value": true},
                {"key": "compressor_value", "value": 0.532}
            ]
        }
        ...
    ]
}
```
