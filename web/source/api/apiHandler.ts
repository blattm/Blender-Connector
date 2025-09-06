import * as ApiEvents from './apiEvent';
import * as Messages from './messages';
import { MessageType } from './messageType';
import { NotImplementedError } from '../common/notImplementedError';
import type { WebSocketClient } from './websocketClient';

enum ServerToClientPayloadMethod
{
    Notify = 'notify',
    State = 'state',
}


//enum ClientToServerPayloadMethod
//{
//    Set = 'set',
//}

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
type ChannelIdentifier = {type: ChannelType, id: number};

enum ScopeString
{
    Global = 'global',
    Connection = 'connection',
}
type Scope = ScopeString | ChannelIdentifier;

enum GlobalKey
{
    Muted = 'muted',
    Microphone = 'microphone',
}

enum ConnectionKeyString
{
    Blender = 'blender',
}
type ConnectionKey = ConnectionKeyString | ChannelIdentifier;

enum OutputKeyString
{
    SoundVolume = 'sound_volume',
    MicrophoneVolume = 'microphone_volume',
    CompressorState = 'compressor_state',
    CompressorValue = 'compressor_value',
}
type OutputKey = OutputKeyString | ChannelIdentifier;

export class ApiHandler
{
    private client: WebSocketClient;

    public onNotifyGlobalMicrophone: ((message: ApiEvents.GlobalMicrophone) => void)|null;
    public onNotifyGlobalMuted: ((message: ApiEvents.GlobalMuted) => void)|null;
    public onNotifyOutputCompressorState: ((message: ApiEvents.OutputCompressorState) => void)|null;
    public onNotifyOutputCompressorValue: ((message: ApiEvents.OutputCompressorValue) => void)|null;
    public onNotifyOutputInputVolume: ((message: ApiEvents.OutputInputVolume) => void)|null;
    public onNotifyOutputMicrophoneVolume: ((message: ApiEvents.OutputMicrophoneVolume) => void)|null;
    public onNotifyOutputSoundVolume: ((message: ApiEvents.OutputSoundVolume) => void)|null;
    public onNotifyConnectionBlender: ((message: ApiEvents.ConnectionBlender) => void)|null;
    public onNotifyConnectionInput: ((message: ApiEvents.ConnectionInput) => void)|null;
    public onNotifyConnectionOutput: ((message: ApiEvents.ConnectionOutput) => void)|null;
    public onState: ((message: ApiEvents.State) => void)|null;

    constructor (webSocketClient: WebSocketClient)
    {
        this.onNotifyGlobalMicrophone = null;
        this.onNotifyGlobalMuted = null;
        this.onNotifyOutputCompressorState = null;
        this.onNotifyOutputCompressorValue = null;
        this.onNotifyOutputInputVolume = null;
        this.onNotifyOutputMicrophoneVolume = null;
        this.onNotifyOutputSoundVolume = null;
        this.onNotifyConnectionBlender = null;
        this.onNotifyConnectionInput = null;
        this.onNotifyConnectionOutput = null;
        this.onState = null;

        this.client = webSocketClient;

        this.client.onDisconnected = this.onClientDisconnected.bind(this);
        this.client.onMessage = this.onMessage.bind(this);
    }

    private onClientDisconnected (): void
    {
        this.client.reconnect();
    }

    private onMessage (data: object): void
    {
        const message = this.parseMessage(data);

        if (message === null)
        {
            return;
        }

        switch (message.type)
        {
            case MessageType.GlobalMicrophone:
                this.onNotifyGlobalMicrophone?.(message);
                break;
            case MessageType.GlobalMuted:
                this.onNotifyGlobalMuted?.(message);
                break;
            case MessageType.OutputCompressorState:
                this.onNotifyOutputCompressorState?.(message);
                break;
            case MessageType.OutputCompressorValue:
                this.onNotifyOutputCompressorValue?.(message);
                break;
            case MessageType.OutputInputVolume:
                this.onNotifyOutputInputVolume?.(message);
                break;
            case MessageType.OutputMicrophoneVolume:
                this.onNotifyOutputMicrophoneVolume?.(message);
                break;
            case MessageType.OutputSoundVolume:
                this.onNotifyOutputSoundVolume?.(message);
                break;
            case MessageType.ConnectionBlender:
                this.onNotifyConnectionBlender?.(message);
                break;
            case MessageType.ConnectionInput:
                this.onNotifyConnectionInput?.(message);
                break;
            case MessageType.ConnectionOutput:
                this.onNotifyConnectionOutput?.(message);
                break;
            case MessageType.State:
                this.onState?.(message);
                break;
        }
    }

    private parseMessage (payload: object): Messages.Message|null
    {
        // TODO: Move the parse methods into a separate parser class.

        const method = this.parseMessageMethod(payload);
        if (method === null)
        {
            return null;
        }

        switch (method)
        {
            case ServerToClientPayloadMethod.Notify:
                return this.parseNotifyMessage(payload);
            case ServerToClientPayloadMethod.State:
                return this.parseStateMessage(payload);
        }
    }

    private parseMessageMethod (payload: object): ServerToClientPayloadMethod|null
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

    private parseNotifyMessage (payload: object): Messages.NotifyMessage|null
    {
        const scope = this.parseScope(payload);
        if (scope === null)
        {
            return null;
        }

        switch (scope)
        {
            case ScopeString.Global:
                return this.parseGlobalMessage(payload);
            case ScopeString.Connection:
                return this.parseConnectionMessage(payload);
            default:
                return this.parseOutputMessage(payload, scope);
        }
    }

    private parseStateMessage (payload: object): Messages.State|null
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

            const scope = this.parseScope(rawBundle);
            if (scope === null)
            {
                continue;
            }

            const bundleMessage = this.parseBundle(rawBundle, scope);
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

    private parseBundle (payload: object, scope: Scope): Messages.Message[]
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
                    message = this.parseGlobalMessage(rawData);
                    break;
                }
                case ScopeString.Connection:
                {
                    message = this.parseConnectionMessage(rawData);
                    break;
                }
                default:
                {
                    message = this.parseOutputMessage(rawData, scope);
                }
            }

            if (message !== null)
            {
                messages.push(message);
            }
        }

        return messages;
    }

    private parseScope (payload: object): Scope|null
    {
        if (!(PropertyName.Scope in payload))
        {
            return null;
        }

        if (this.isEnumValue(ScopeString, payload.scope))
        {
            return payload.scope;
        }
        else if (typeof payload.scope === 'object')
        {
            return this.parseChannelIdentifier(payload.scope);
        }
        else
        {
            return null;
        }
    }

    private parseChannelIdentifier (potentialChannel: object|null): ChannelIdentifier|null
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

        if (this.isEnumValue(ChannelType, potentialChannel.type) === false)
        {
            return null;
        }

        return {
            type: potentialChannel.type,
            id: potentialChannel.id
        };
    }

    private parseGlobalMessage (payload: object): Messages.GlobalMessage|null
    {
        const key = this.parseGlobalKey(payload);
        if (key === null)
        {
            return null;
        }

        const value = this.parseBooleanValue(payload);
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

    private parseGlobalKey (payload: object): GlobalKey|null
    {
        if (!(PropertyName.Key in payload))
        {
            return null;
        }

        if (this.isEnumValue(GlobalKey, payload.key))
        {
            return payload.key;
        }
        else
        {
            return null;
        }
    }

    private parseBooleanValue (payload: object): boolean|null
    {
        if (!(PropertyName.Value in payload) || typeof payload.value !== 'boolean')
        {
            return null;
        }

        return payload.value;
    }

    private parseNumberValue (payload: object): number|null
    {
        if (!(PropertyName.Value in payload) || typeof payload.value !== 'number')
        {
            return null;
        }

        return payload.value;
    }

    private parseConnectionMessage (payload: object): Messages.ConnectionMessage|null
    {
        const key = this.parseConnectionKey(payload);
        if (key === null)
        {
            return null;
        }

        const value = this.parseBooleanValue(payload);
        if (value === null)
        {
            return null;
        }

        if (this.isEnumValue(ConnectionKeyString, key))
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

    private parseConnectionKey (payload: object): ConnectionKey|null
    {
        if (!(PropertyName.Key in payload))
        {
            return null;
        }

        if (this.isEnumValue(ConnectionKeyString, payload.key))
        {
            return payload.key;
        }
        else if (typeof payload.key === 'object')
        {
            return this.parseChannelIdentifier(payload.key);
        }
        else
        {
            return null;
        }
    }

    private parseOutputMessage (payload: object, scope: ChannelIdentifier): Messages.OutputMessage|null
    {
        const key = this.parseOutputKey(payload);
        if (key === null)
        {
            return null;
        }

        if (typeof key === 'string')
        {
            return this.parseOutputMessageWithKeyString(payload, scope, key);
        }
        else
        {
            const value = this.parseNumberValue(payload);
            if (value === null)
            {
                return null;
            }

            return new Messages.OutputInputVolume(scope.id, key.id, value);
        }
    }

    private parseOutputMessageWithKeyString (payload: object, scope: ChannelIdentifier, key: OutputKeyString): Messages.OutputMessage|null
    {
        switch (key)
        {
            case OutputKeyString.SoundVolume:
            {
                const value = this.parseNumberValue(payload);
                if (value === null)
                {
                    return null;
                }

                return new Messages.OutputSoundVolume(scope.id, value);
            }
            case OutputKeyString.MicrophoneVolume:
            {
                const value = this.parseNumberValue(payload);
                if (value === null)
                {
                    return null;
                }

                return new Messages.OutputMicrophoneVolume(scope.id, value);
            }
            case OutputKeyString.CompressorState:
            {
                const value = this.parseBooleanValue(payload);
                if (value === null)
                {
                    return null;
                }

                return new Messages.OutputCompressorState(scope.id, value);
            }
            case OutputKeyString.CompressorValue:
            {
                const value = this.parseNumberValue(payload);
                if (value === null)
                {
                    return null;
                }

                return new Messages.OutputCompressorValue(scope.id, value);
            }
        }
    }

    private parseOutputKey (payload: object): OutputKey|null
    {
        if (!(PropertyName.Key in payload))
        {
            return null;
        }

        if (this.isEnumValue(OutputKeyString, payload.key))
        {
            return payload.key;
        }
        else if (typeof payload.key === 'object')
        {
            return this.parseChannelIdentifier(payload.key);
        }
        else
        {
            return null;
        }
    }

    private isEnumValue<T extends Record<string, unknown>> (enumObject: T, value: unknown): value is T[keyof T]
    {
        if (typeof value !== 'string' && typeof value !== 'number')
        {
            return false;
        }

        return Object.values(enumObject).includes(value);
    }

    //private sendMessage (message: Messages.Message): void
    //{
    //    throw new NotImplementedError(); // TODO: Implement.
    //}

    public setMuted (value: boolean): void
    {
        throw new NotImplementedError(`${value}`); // TODO: Implement.
    }

    public setMicrophone (enabled: boolean): void
    {
        throw new NotImplementedError(`${enabled}`); // TODO: Implement.
    }

    public setSoundVolume (outputId: number, volume: number): void
    {
        throw new NotImplementedError(`${outputId}-${volume}`); // TODO: Implement.
    }

    public setMicrophoneVolume (outputId: number, volume: number): void
    {
        throw new NotImplementedError(`${outputId}-${volume}`); // TODO: Implement.
    }

    public setCompressorState (outputId: number, enabled: boolean): void
    {
        throw new NotImplementedError(`${outputId}-${enabled}`); // TODO: Implement.
    }

    public setCompressorValue (outputId: number, value: number): void
    {
        throw new NotImplementedError(`${outputId}-${value}`); // TODO: Implement.
    }

    public setInput (outputId: number, inputId: number, value: number): void
    {
        throw new NotImplementedError(`${outputId}:${inputId}-${value}`); // TODO: Implement.
    }
}
