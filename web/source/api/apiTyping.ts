// Common Definitions

export enum Method
{
    Set = 'set',
    Notify = 'notify',
    State = 'state',
}

export enum Scope
{
    Global = 'global',
    Connection = 'connection',
}

export enum ChannelType
{
    Input = 'input',
    Output = 'output',
}

export enum Key
{
    Microphone = 'microphone',
    Muted = 'muted',
    SoundVolume = 'sound_volume',
    MicrophoneVolume = 'microphone_volume',
    CompressorState = 'compressor_state',
    CompressorValue = 'compressor_value',
    Blender = 'blender',
}

type Channel<TChannelType extends ChannelType> =
{
    type: TChannelType;
    id: number;
};

type KeyValuePair<
    TKey extends Channel<ChannelType>|Key,
    TValue extends boolean|number> =
{
    key: TKey;
    value: TValue;
};

type BaseObject<
    TMethod extends Method,
    TScope extends Channel<ChannelType>|Scope,
    TKey extends Channel<ChannelType>|Key,
    TValue extends boolean|number> =
{
    method: TMethod;
    scope: TScope;
} &
    KeyValuePair<TKey, TValue>;

// Set Objects

type SetGlobalObject = BaseObject<Method.Set, Scope.Global, Key.Microphone|Key.Muted, boolean>;

type SetOutputNumberObject = BaseObject<
    Method.Set,
    Channel<ChannelType.Output>,
    Key.SoundVolume | Key.MicrophoneVolume | Key.CompressorValue,
    number
>;

type SetOutputBooleanObject = BaseObject<Method.Set, Channel<ChannelType.Output>, Key.CompressorState, boolean>;

type SetOutputInputVolumeObject = BaseObject<Method.Set, Channel<ChannelType.Output>, Channel<ChannelType.Input>, number>;

export type ApiSetObject = SetGlobalObject | SetOutputNumberObject | SetOutputBooleanObject | SetOutputInputVolumeObject;

// Notify Objects

type MakeNotifyObject<T> = Omit<T, 'method'> & { method: Method.Notify; };

type NotifyConnectionBlenderObject = BaseObject<Method.Notify, Scope.Connection, Key.Blender, boolean>;

type NotifyConnectionOutputObject = BaseObject<Method.Notify, Scope.Connection, Channel<ChannelType.Output>, boolean>;

type NotifyConnectionInputObject = BaseObject<Method.Notify, Scope.Connection, Channel<ChannelType.Input>, number>;

type NotifyConnectionObject = NotifyConnectionBlenderObject | NotifyConnectionOutputObject | NotifyConnectionInputObject;

export type NotifyObject = MakeNotifyObject<ApiSetObject> | NotifyConnectionObject;

// State Object

type GlobalBundle =
{
    scope: Scope.Global;
    data: KeyValuePair<Key.Microphone|Key.Muted, boolean>[];
};

type OutputBundle =
{
    scope: Channel<ChannelType.Output>;
    data: Array<
        KeyValuePair<Key.SoundVolume|Key.MicrophoneVolume|Key.CompressorValue, number>
        | KeyValuePair<Key.CompressorState, boolean>
        | KeyValuePair<Channel<ChannelType.Input>, number>
    >;
};

type ConnectionBundle =
{
    scope: Scope.Connection;
    data: Array<
        KeyValuePair<Channel<ChannelType.Input>, boolean>
        | KeyValuePair<Channel<ChannelType.Output>, number>
        | KeyValuePair<Key.Blender, boolean>
    >;
};

export type StateObject =
{
    method: Method.State;
    bundles: Array<GlobalBundle | ConnectionBundle | OutputBundle>
};

// Api Message Object

export type ApiMessageObject = ApiSetObject | NotifyObject | StateObject;
