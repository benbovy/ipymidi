import traitlets as tt

MESSAGE = tt.Dict(
    per_key_traits={
        "type": tt.Unicode(help="message type"),
        "channel": tt.Int(min=1, max=16, allow_none=True, help="MIDI channel number"),
        "data": tt.List(
            tt.Int(min=0, max=255),
            help="MIDI message content as a list of bytes (0-255)",
        ),
    },
    help="Information about a single MIDI message",
)


EVENT_TRAITS: dict[str, dict[str, dict[str, tt.TraitType]]] = {
    "input": {
        "midimessage": {
            "message": MESSAGE,
        },
        "noteon": {
            "value": tt.Float(0.0, help="Attack velocity [0-1]"),
            "raw_value": tt.Int(0, help="Attack velocity [0-127]"),
        },
    }
}
