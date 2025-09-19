import * as ApiMessages from './apiMessage';
import type { WebSocketClient } from './websocketClient';

export class ApiHandler
{
    private readonly client: WebSocketClient;

    public onNotifyGlobalMicrophone: ((message: ApiMessages.NotifyGlobalMicrophone) => void)|null;
    public onNotifyGlobalMuted: ((message: ApiMessages.NotifyGlobalMuted) => void)|null;
    public onNotifyOutputCompressorState: ((message: ApiMessages.NotifyOutputCompressorState) => void)|null;
    public onNotifyOutputCompressorValue: ((message: ApiMessages.NotifyOutputCompressorValue) => void)|null;
    public onNotifyOutputInputVolume: ((message: ApiMessages.NotifyOutputInputVolume) => void)|null;
    public onNotifyOutputMicrophoneVolume: ((message: ApiMessages.NotifyOutputMicrophoneVolume) => void)|null;
    public onNotifyOutputSoundVolume: ((message: ApiMessages.NotifyOutputSoundVolume) => void)|null;
    public onNotifyConnectionBlender: ((message: ApiMessages.NotifyConnectionBlender) => void)|null;
    public onNotifyConnectionInput: ((message: ApiMessages.NotifyConnectionInput) => void)|null;
    public onNotifyConnectionOutput: ((message: ApiMessages.NotifyConnectionOutput) => void)|null;

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

        this.client = webSocketClient;

        this.client.onDisconnected = this.onClientDisconnected.bind(this);
        this.client.onMessage = this.onMessage.bind(this);
    }

    private onClientDisconnected (): void
    {
        this.client.reconnect();
    }

    private onMessage (data: string): void
    {
        if (!this.tryDispatchMessage(data))
        {
            console.error('ApiHandler: Unable to parse incoming message: ', data);
        }
    }

    private tryDispatchMessage (data: string): boolean
    {
        try
        {
            const messageObject = JSON.parse(data) as ApiMessages.Message|null;

            if (messageObject === null)
            {
                return false;
            }

            switch (messageObject.method)
            {
                case ApiMessages.Method.Set:
                    return false;
                case ApiMessages.Method.Notify:
                    this.dispatchNotifyMessage(messageObject);
                    return true;
                case ApiMessages.Method.State:
                    for (const bundle of messageObject.bundles)
                    {
                        for (const data of bundle.data)
                        {
                            const unbundledMessageObject =
                            {
                                method: ApiMessages.Method.Notify,
                                scope: bundle.scope,
                                key: data.key,
                                value: data.value,
                            } as ApiMessages.Notify; // TODO: How could this assertion be avoided?

                            this.dispatchNotifyMessage(unbundledMessageObject);
                        }
                    }
                    return true;
            }
        }
        catch
        {
            return false;
        }
    }

    private dispatchNotifyMessage (messageObject: ApiMessages.Notify): void
    {
        switch (messageObject.scope)
        {
            case ApiMessages.Scope.Global:
                switch (messageObject.key)
                {
                    case ApiMessages.Key.Microphone:
                        this.onNotifyGlobalMicrophone?.(messageObject);
                        return;
                    case ApiMessages.Key.Muted:
                        this.onNotifyGlobalMuted?.(messageObject);
                        return;
                }
            case ApiMessages.Scope.Connection:
                switch (messageObject.key)
                {
                    case ApiMessages.Key.Blender:
                        this.onNotifyConnectionBlender?.(messageObject);
                        return;
                    default:
                        switch (messageObject.key.type)
                        {
                            case ApiMessages.ChannelType.Input:
                            {
                                const inputMessage = {
                                    ...messageObject,
                                    key: messageObject.key,
                                };
                                this.onNotifyConnectionInput?.(inputMessage);
                                return;
                            }
                            case ApiMessages.ChannelType.Output:
                                const outputMessage = {
                                    ...messageObject,
                                    key: messageObject.key,
                                };
                                this.onNotifyConnectionOutput?.(outputMessage);
                                return;
                        }
                }
            default:
                switch (messageObject.key)
                {
                    case ApiMessages.Key.CompressorState:
                        this.onNotifyOutputCompressorState?.(messageObject);
                        return;
                    case ApiMessages.Key.CompressorValue:
                        this.onNotifyOutputCompressorValue?.(messageObject);
                        return;
                    case ApiMessages.Key.MicrophoneVolume:
                        this.onNotifyOutputMicrophoneVolume?.(messageObject);
                        return;
                    case ApiMessages.Key.SoundVolume:
                        this.onNotifyOutputSoundVolume?.(messageObject);
                        return;
                    default:
                        this.onNotifyOutputInputVolume?.(messageObject);
                        return;
                }
        }
    }

    private sendMessage (messageObject: ApiMessages.Set): void
    {
        const messageString = JSON.stringify(messageObject);
        this.client.send(messageString);
    }

    public setMuted (value: boolean): void
    {
        const messageObject: ApiMessages.SetGlobalMuted =
        {
            method: ApiMessages.Method.Set,
            scope: ApiMessages.Scope.Global,
            key: ApiMessages.Key.Muted,
            value: value,
        };

        this.sendMessage(messageObject);
    }

    public setMicrophone (enabled: boolean): void
    {
        const messageObject: ApiMessages.SetGlobalMicrophone =
        {
            method: ApiMessages.Method.Set,
            scope: ApiMessages.Scope.Global,
            key: ApiMessages.Key.Microphone,
            value: enabled,
        };

        this.sendMessage(messageObject);
    }

    public setSoundVolume (outputId: number, volume: number): void
    {
        const messageObject: ApiMessages.SetOutputSoundVolume =
        {
            method: ApiMessages.Method.Set,
            scope: {
                type: ApiMessages.ChannelType.Output,
                id: outputId,
            },
            key: ApiMessages.Key.SoundVolume,
            value: volume,
        };

        this.sendMessage(messageObject);
    }

    public setMicrophoneVolume (outputId: number, volume: number): void
    {
        const messageObject: ApiMessages.SetOutputMicrophoneVolume =
        {
            method: ApiMessages.Method.Set,
            scope: {
                type: ApiMessages.ChannelType.Output,
                id: outputId,
            },
            key: ApiMessages.Key.MicrophoneVolume,
            value: volume,
        };

        this.sendMessage(messageObject);
    }

    public setCompressorState (outputId: number, enabled: boolean): void
    {
        const messageObject: ApiMessages.SetOutputCompressorState =
        {
            method: ApiMessages.Method.Set,
            scope: {
                type: ApiMessages.ChannelType.Output,
                id: outputId,
            },
            key: ApiMessages.Key.CompressorState,
            value: enabled,
        };

        this.sendMessage(messageObject);
    }

    public setCompressorValue (outputId: number, value: number): void
    {
        const messageObject: ApiMessages.SetOutputCompressorValue =
        {
            method: ApiMessages.Method.Set,
            scope: {
                type: ApiMessages.ChannelType.Output,
                id: outputId,
            },
            key: ApiMessages.Key.CompressorValue,
            value: value,
        };

        this.sendMessage(messageObject);
    }

    public setInput (outputId: number, inputId: number, value: number): void
    {
        const messageObject: ApiMessages.SetOutputInputVolume =
        {
            method: ApiMessages.Method.Set,
            scope: {
                type: ApiMessages.ChannelType.Output,
                id: outputId,
            },
            key: {
                type: ApiMessages.ChannelType.Input,
                id: inputId,
            },
            value: value,
        };

        this.sendMessage(messageObject);
    }
}
