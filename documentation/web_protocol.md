# Web Protocol

## Draft

"type": "set" means client -> server communication of a change made by this client

{"type": "set", "scope": "out1", "target": "in1", "value": 0.532} // similar for out2, out3, out4; in2, ..., in6
{"type": "set", "scope": "out1", "target": "level", "value": 0.532}
{"type": "set", "scope": "out1", "target": "room", "value": 0.532}
{"type": "set", "scope": "out1", "target": "comp_val", "value": 0.3}
{"type": "set", "scope": "out1", "target": "comp_on", "value": true}

{"type": "set", "scope": "global", "target": "mute", "value": true}
{"type": "set", "scope": "global", "target": "talk", "value": true}

for server -> client communication, when a value was changed on server:
same as above, but "type": "notify"

server -> client connection status:
{"type": "connections", "blender":true, "ports":{"in1":false, ..., "out4": true}} // does not need to be complete, can send changed subsets only

client requests state from server:
{"type": "request"} // request complete state from server
{"type": "request", "scope": "out1"}   // request partial state from server
{"type": "request", "scopes": ["out2", "global"]} // request partial state from server

server sends complete state to client: // there is a smarter way to do this, but maybe best for now
{"type": "state", "data": [
    //connection message + all required notify message
]}

"compressed" representations which provide full context do not really save that much space:
{"type": "state", "data": [
    {"type": "connections", ...},
    {"type": "notify", "data": [
        {"scope": "out1", "data":[
            {"target": "in1", "value": 0.5},
            {"target": "in2", "value": 0.5},
            ...
        ]},
        {"scope": "out2", "data":[
            {"target": "in1", "value": 0.5},
            {"target": "in2", "value": 0.5},
            ...
        ]},
        ...
    ]}
]}

or we use some kind of table: (this comes with the advantage of being self-describing and compact. It also allows partial updates and complete updates)
{"type": "state_table": "rows": ["in1", ..., "level"], "columns": ["out1", "out2"], "values":[0.5, 0.7, true, 0.8, ...]}
... combined with two messages for the global flags and one for the connections. potentially all wrapped in a single "state" message's data part.
