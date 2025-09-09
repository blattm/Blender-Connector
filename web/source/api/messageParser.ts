import * as Messages from './messages';
import * as Utility from '../common/utility';
import { MessageType } from './messageType';

// TODO: Use the new ApiTyping module in the parse functions.
// type PartialMessageObject = Partial<ApiMessageObject>;

enum PropertyName
{
    Bundles = 'bundles',
    Data = 'data',
    Id = 'id',
    Key = 'key',
    Method = 'method',
    Scope = 'scope',
    Type = 'type',
    Value = 'value',
}

enum ChannelType
{
    Input = 'input',
    Output = 'output',
}
type ChannelIdentifier = { type: ChannelType, id: number; };

enum ScopeString
{
    Global = 'global',
    Connection = 'connection',
}
type Scope = ScopeString|ChannelIdentifier;

enum GlobalKey
{
    Muted = 'muted',
    Microphone = 'microphone',
}

enum ConnectionKeyString
{
    Blender = 'blender',
}
type ConnectionKey = ConnectionKeyString|ChannelIdentifier;

enum OutputKeyString
{
    SoundVolume = 'sound_volume',
    MicrophoneVolume = 'microphone_volume',
    CompressorState = 'compressor_state',
    CompressorValue = 'compressor_value',
}
type OutputKey = OutputKeyString|ChannelIdentifier;

enum ServerToClientPayloadMethod
{
    Notify = 'notify',
    State = 'state',
}

/**
 * Parses a JSON string into a message object.
 * @param data The JSON string to parse.
 * @returns The parsed message object, or null if the parsing failed.
 */
export function parse (data: string): Messages.Message|null
{
    let jsonObject: unknown;
    try
    {
        jsonObject = JSON.parse(data);
    }
    catch
    {
        return null;
    }

    if (typeof jsonObject === 'object' && jsonObject !== null)
    {
        const message = parseMessage(jsonObject);
        return message;
    }
    else
    {
        return null;
    }
}

function parseMessage (payload: object): Messages.Message|null
{
    const method = parseMessageMethod(payload);
    if (method === null)
    {
        return null;
    }

    switch (method)
    {
        case ServerToClientPayloadMethod.Notify:
            return parseNotifyMessage(payload);
        case ServerToClientPayloadMethod.State:
            return parseStateMessage(payload);
    }
}

function parseMessageMethod (payload: object): ServerToClientPayloadMethod|null
{
    if (!(PropertyName.Method in payload) || typeof payload.method !== 'string')
    {
        return null;
    }

    const possibleValues = Object.values(ServerToClientPayloadMethod) as string[];
    if (possibleValues.includes(payload.method))
    {
        return payload.method as ServerToClientPayloadMethod;
    }
    else
    {
        return null;
    }
}

function parseNotifyMessage (payload: object): Messages.NotifyMessage|null
{
    const scope = parseScope(payload);
    if (scope === null)
    {
        return null;
    }

    switch (scope)
    {
        case ScopeString.Global:
            return parseGlobalMessage(payload);
        case ScopeString.Connection:
            return parseConnectionMessage(payload);
        default:
            return parseOutputMessage(payload, scope);
    }
}

function parseStateMessage (payload: object): Messages.State|null
{
    if (!(PropertyName.Bundles in payload) || !Array.isArray(payload.bundles))
    {
        return null;
    }

    const messages: Messages.Message[] = [];
    for (const rawBundle of payload.bundles as unknown[])
    {
        if (typeof rawBundle !== 'object' || rawBundle === null)
        {
            continue;
        }

        const scope = parseScope(rawBundle);
        if (scope === null)
        {
            continue;
        }

        const bundleMessage = parseBundle(rawBundle, scope);
        messages.push(...bundleMessage);
    }

    let globalMicrophone: Messages.GlobalMicrophone|null = null;
    let globalMuted: Messages.GlobalMuted|null = null;
    const outputCompressorStates: Messages.OutputCompressorState[] = [];
    const outputCompressorValues: Messages.OutputCompressorValue[] = [];
    const outputInputVolumes: Messages.OutputInputVolume[][] = [];
    const outputMicrophoneVolumes: Messages.OutputMicrophoneVolume[] = [];
    const outputSoundVolumes: Messages.OutputSoundVolume[] = [];
    let connectionBlender: Messages.ConnectionBlender|null = null;
    const connectionInputs: Messages.ConnectionInput[] = [];
    const connectionOutputs: Messages.ConnectionOutput[] = [];

    // TODO: The following is rather inefficient. How could this be improved?
    for (const message of messages)
    {
        switch (message.type)
        {
            case MessageType.GlobalMicrophone:
                globalMicrophone = message;
                break;
            case MessageType.GlobalMuted:
                globalMuted = message;
                break;
            case MessageType.OutputCompressorState:
                outputCompressorStates[message.outputId] = message;
                break;
            case MessageType.OutputCompressorValue:
                outputCompressorValues[message.outputId] = message;
                break;
            case MessageType.OutputInputVolume:
                if (outputInputVolumes[message.outputId] === undefined)
                {
                    outputInputVolumes[message.outputId] = [];
                }
                outputInputVolumes[message.outputId][message.inputId] = message;
                break;
            case MessageType.OutputMicrophoneVolume:
                outputMicrophoneVolumes[message.outputId] = message;
                break;
            case MessageType.OutputSoundVolume:
                outputSoundVolumes[message.outputId] = message;
                break;
            case MessageType.ConnectionBlender:
                connectionBlender = message;
                break;
            case MessageType.ConnectionInput:
                connectionInputs[message.inputId] = message;
                break;
            case MessageType.ConnectionOutput:
                connectionOutputs[message.outputId] = message;
                break;
            case MessageType.State:
                return null;
        }
    }

    if (globalMicrophone === null || globalMuted === null || connectionBlender === null)
    {
        return null;
    }

    // NOTE: This assumes zero-based indices without gaps as the protocol specifies.
    for (const array of [
        outputCompressorStates,
        outputCompressorValues,
        outputInputVolumes,
        outputMicrophoneVolumes,
        outputSoundVolumes])
    {
        for (const message of array)
        {
            if (message === null)
            {
                return null;
            }
        }
    }

    // TODO: Can we verify that all arrays have the correct length? The protocol does not specify the amount of channels.

    return new Messages.State(
        globalMicrophone,
        globalMuted,
        outputCompressorStates,
        outputCompressorValues,
        outputInputVolumes,
        outputMicrophoneVolumes,
        outputSoundVolumes,
        connectionBlender,
        connectionInputs,
        connectionOutputs
    );
}

function parseBundle (payload: object, scope: Scope): Messages.Message[]
{
    if (!(PropertyName.Data in payload) || !Array.isArray(payload.data))
    {
        return [];
    }

    const messages: Messages.Message[] = [];

    for (const rawData of payload.data as unknown[])
    {
        if (typeof rawData !== 'object' || rawData === null)
        {
            continue;
        }

        let message: Messages.Message|null = null;
        switch (scope)
        {
            case ScopeString.Global:
            {
                message = parseGlobalMessage(rawData);
                break;
            }
            case ScopeString.Connection:
            {
                message = parseConnectionMessage(rawData);
                break;
            }
            default:
            {
                message = parseOutputMessage(rawData, scope);
            }
        }

        if (message !== null)
        {
            messages.push(message);
        }
    }

    return messages;
}

function parseScope (payload: object): Scope|null
{
    if (!(PropertyName.Scope in payload))
    {
        return null;
    }

    if (Utility.isEnumValue(ScopeString, payload.scope))
    {
        return payload.scope;
    }
    else if (typeof payload.scope === 'object')
    {
        return parseChannelIdentifier(payload.scope);
    }
    else
    {
        return null;
    }
}

function parseChannelIdentifier (potentialChannel: object|null): ChannelIdentifier|null
{
    if (typeof potentialChannel !== 'object' || potentialChannel === null)
    {
        return null;
    }

    if (!(PropertyName.Type in potentialChannel) || !(PropertyName.Id in potentialChannel))
    {
        return null;
    }

    if (typeof potentialChannel.type !== 'string' || typeof potentialChannel.id !== 'number')
    {
        return null;
    }

    if (Utility.isEnumValue(ChannelType, potentialChannel.type) === false)
    {
        return null;
    }

    return {
        type: potentialChannel.type,
        id: potentialChannel.id
    };
}

function parseGlobalMessage (payload: object): Messages.GlobalMessage|null
{
    const key = parseGlobalKey(payload);
    if (key === null)
    {
        return null;
    }

    const value = parseBooleanValue(payload);
    if (value === null)
    {
        return null;
    }

    switch (key)
    {
        case GlobalKey.Microphone:
            return new Messages.GlobalMicrophone(value);
        case GlobalKey.Muted:
            return new Messages.GlobalMuted(value);
    }
}

function parseGlobalKey (payload: object): GlobalKey|null
{
    if (!(PropertyName.Key in payload))
    {
        return null;
    }

    if (Utility.isEnumValue(GlobalKey, payload.key))
    {
        return payload.key;
    }
    else
    {
        return null;
    }
}

function parseBooleanValue (payload: object): boolean|null
{
    if (!(PropertyName.Value in payload) || typeof payload.value !== 'boolean')
    {
        return null;
    }

    return payload.value;
}

function parseNumberValue (payload: object): number|null
{
    if (!(PropertyName.Value in payload) || typeof payload.value !== 'number')
    {
        return null;
    }

    return payload.value;
}

function parseConnectionMessage (payload: object): Messages.ConnectionMessage|null
{
    const key = parseConnectionKey(payload);
    if (key === null)
    {
        return null;
    }

    const value = parseBooleanValue(payload);
    if (value === null)
    {
        return null;
    }

    if (Utility.isEnumValue(ConnectionKeyString, key))
    {
        return new Messages.ConnectionBlender(value);
    }
    else
    {
        switch (key.type)
        {
            case ChannelType.Input:
                return new Messages.ConnectionInput(key.id, value);
            case ChannelType.Output:
                return new Messages.ConnectionOutput(key.id, value);
        }
    }
}

function parseConnectionKey (payload: object): ConnectionKey|null
{
    if (!(PropertyName.Key in payload))
    {
        return null;
    }

    if (Utility.isEnumValue(ConnectionKeyString, payload.key))
    {
        return payload.key;
    }
    else if (typeof payload.key === 'object')
    {
        return parseChannelIdentifier(payload.key);
    }
    else
    {
        return null;
    }
}

function parseOutputMessage (payload: object, scope: ChannelIdentifier): Messages.OutputMessage|null
{
    const key = parseOutputKey(payload);
    if (key === null)
    {
        return null;
    }

    if (typeof key === 'string')
    {
        return parseOutputMessageWithKeyString(payload, scope, key);
    }
    else
    {
        const value = parseNumberValue(payload);
        if (value === null)
        {
            return null;
        }

        return new Messages.OutputInputVolume(scope.id, key.id, value);
    }
}

function parseOutputMessageWithKeyString (payload: object, scope: ChannelIdentifier, key: OutputKeyString): Messages.OutputMessage|null
{
    switch (key)
    {
        case OutputKeyString.SoundVolume:
        {
            const value = parseNumberValue(payload);
            if (value === null)
            {
                return null;
            }

            return new Messages.OutputSoundVolume(scope.id, value);
        }
        case OutputKeyString.MicrophoneVolume:
        {
            const value = parseNumberValue(payload);
            if (value === null)
            {
                return null;
            }

            return new Messages.OutputMicrophoneVolume(scope.id, value);
        }
        case OutputKeyString.CompressorState:
        {
            const value = parseBooleanValue(payload);
            if (value === null)
            {
                return null;
            }

            return new Messages.OutputCompressorState(scope.id, value);
        }
        case OutputKeyString.CompressorValue:
        {
            const value = parseNumberValue(payload);
            if (value === null)
            {
                return null;
            }

            return new Messages.OutputCompressorValue(scope.id, value);
        }
    }
}

function parseOutputKey (payload: object): OutputKey|null
{
    if (!(PropertyName.Key in payload))
    {
        return null;
    }

    if (Utility.isEnumValue(OutputKeyString, payload.key))
    {
        return payload.key;
    }
    else if (typeof payload.key === 'object')
    {
        return parseChannelIdentifier(payload.key);
    }
    else
    {
        return null;
    }
}
