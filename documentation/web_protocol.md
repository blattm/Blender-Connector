# Web Protocol

This is a draft.

## Client to Server Messages

Available methods: `set`
Available scopes: `global`, `output` (with id 0-3)
Available keys:
  - For `global` scope: `muted`, `microphone`
  - For `output` scope: `sound_volume`, `microphone_volume`, `compressor_state`, `compressor_value`, `input` (with id 0-5)

Global settings:
```json
{"method": "set", "scope": "global", "key": "muted", "value": true}
{"method": "set", "scope": "global", "key": "microphone", "value": true}
```

Local (output-bound) setting:
```json
{
    "method": "set",
    "scope": {
        "type": "output",
        "id": 0
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
        "id": 0
    },
    "key": {
        "type": "input",
        "id": 0
    },
    "value": 0.532
}
```

## Server to Client Messages

Available methods: `notify`, `state`
Available scopes: `global`, `output` (with id 0-3), `connection`
Available keys:
  - For `global` scope: `muted`, `microphone`
  - For `output` scope: `sound_volume`, `microphone_volume`, `compressor_state`, `compressor_value`, `input` (with id 0-5)
  - For `connection` scope: `output` (with id 0-3), `input` (with id 0-5), `blender`

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
                {"key": "muted", "value": true},
                {"key": "microphone", "value": true}
            ]
        },
        {
            "scope": {"type": "output", "id": 0},
            "data": [
                {"key": {"type": "input", "id": 0}, "value": 0.532},
                {"key": {"type": "input", "id": 1}, "value": 0.532},
                {"key": {"type": "input", "id": 2}, "value": 0.532},
                {"key": {"type": "input", "id": 3}, "value": 0.532},
                {"key": {"type": "input", "id": 4}, "value": 0.532},
                {"key": {"type": "input", "id": 5}, "value": 0.532},
                {"key": "microphone_volume", "value": 0.532},
                {"key": "sound_volume", "value": 0.532},
                {"key": "compressor_state", "value": true},
                {"key": "compressor_value", "value": 0.532}
            ]
        },
        ...
        {
            "scope": "connection",
            "data": [
                {"key": {"type": "output", "id": 0}, "value": true},
                ...
                {"key": {"type": "input", "id": 0}, "value": true},
                ...
                {"key": "blender", "value": true}
            ]
        }
    ]
}
```
