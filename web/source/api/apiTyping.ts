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

// Set

export type SetGlobalMicrophone = BaseObject<Method.Set, Scope.Global, Key.Microphone, boolean>;
export type SetGlobalMuted = BaseObject<Method.Set, Scope.Global, Key.Muted, boolean>;
type SetGlobal = SetGlobalMicrophone | SetGlobalMuted;

type SetOutputNumber<TKey extends Channel<ChannelType>|Key> = BaseObject<
    Method.Set,
    Channel<ChannelType.Output>,
    TKey,
    number
>;

export type SetOutputSoundVolume = SetOutputNumber<Key.SoundVolume>;
export type SetOutputMicrophoneVolume = SetOutputNumber<Key.MicrophoneVolume>;
export type SetOutputCompressorValue = SetOutputNumber<Key.CompressorValue>;
export type SetOutputInputVolume = SetOutputNumber<Channel<ChannelType.Input>>;
export type SetOutputCompressorState = BaseObject<Method.Set, Channel<ChannelType.Output>, Key.CompressorState, boolean>;
type SetOutput = SetOutputSoundVolume
    | SetOutputMicrophoneVolume
    | SetOutputCompressorValue
    | SetOutputInputVolume
    | SetOutputCompressorState;

export type Set = SetGlobal | SetOutput;

// Notify

type MakeNotify<T> = Omit<T, 'method'> & { method: Method.Notify; };

export type NotifyGlobalMicrophone = MakeNotify<SetGlobalMicrophone>;
export type NotifyGlobalMuted = MakeNotify<SetGlobalMuted>;
type NotifyGlobal = NotifyGlobalMicrophone | NotifyGlobalMuted;

export type NotifyOutputSoundVolume = MakeNotify<SetOutputSoundVolume>;
export type NotifyOutputMicrophoneVolume = MakeNotify<SetOutputMicrophoneVolume>;
export type NotifyOutputCompressorValue = MakeNotify<SetOutputCompressorValue>;
export type NotifyOutputInputVolume = MakeNotify<SetOutputInputVolume>;
export type NotifyOutputCompressorState = MakeNotify<SetOutputCompressorState>;
type NotifyOutput = NotifyOutputSoundVolume
    | NotifyOutputMicrophoneVolume
    | NotifyOutputCompressorValue
    | NotifyOutputInputVolume
    | NotifyOutputCompressorState;

export type NotifyConnectionBlender = BaseObject<Method.Notify, Scope.Connection, Key.Blender, boolean>;
export type NotifyConnectionOutput = BaseObject<Method.Notify, Scope.Connection, Channel<ChannelType.Output>, boolean>;
export type NotifyConnectionInput = BaseObject<Method.Notify, Scope.Connection, Channel<ChannelType.Input>, boolean>;
type NotifyConnection = NotifyConnectionBlender | NotifyConnectionOutput | NotifyConnectionInput;

export type Notify = NotifyGlobal | NotifyOutput | NotifyConnection;

// State

type GlobalBundle =
{
    scope: Scope.Global;
    data: Array<
        KeyValuePair<Key.Microphone, boolean>
        | KeyValuePair<Key.Muted, boolean>
    >;
};

type OutputBundle =
{
    scope: Channel<ChannelType.Output>;
    data: Array<
        KeyValuePair<Key.SoundVolume, number>
        | KeyValuePair<Key.MicrophoneVolume, number>
        | KeyValuePair<Key.CompressorValue, number>
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

export type State =
{
    method: Method.State;
    bundles: Array<GlobalBundle | ConnectionBundle | OutputBundle>
};

// Api Message

export type Message = Set | Notify | State;
