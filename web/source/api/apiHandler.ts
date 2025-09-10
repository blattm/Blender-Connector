import * as ApiTyping from './apiTyping';
import type { WebSocketClient } from './websocketClient';

export class ApiHandler
{
    private readonly client: WebSocketClient;

    public onNotifyGlobalMicrophone: ((message: ApiTyping.NotifyGlobalMicrophone) => void)|null;
    public onNotifyGlobalMuted: ((message: ApiTyping.NotifyGlobalMuted) => void)|null;
    public onNotifyOutputCompressorState: ((message: ApiTyping.NotifyOutputCompressorState) => void)|null;
    public onNotifyOutputCompressorValue: ((message: ApiTyping.NotifyOutputCompressorValue) => void)|null;
    public onNotifyOutputInputVolume: ((message: ApiTyping.NotifyOutputInputVolume) => void)|null;
    public onNotifyOutputMicrophoneVolume: ((message: ApiTyping.NotifyOutputMicrophoneVolume) => void)|null;
    public onNotifyOutputSoundVolume: ((message: ApiTyping.NotifyOutputSoundVolume) => void)|null;
    public onNotifyConnectionBlender: ((message: ApiTyping.NotifyConnectionBlender) => void)|null;
    public onNotifyConnectionInput: ((message: ApiTyping.NotifyConnectionInput) => void)|null;
    public onNotifyConnectionOutput: ((message: ApiTyping.NotifyConnectionOutput) => void)|null;

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
            const messageObject = JSON.parse(data) as ApiTyping.Message|null;

            if (messageObject === null)
            {
                return false;
            }

            switch (messageObject.method)
            {
                case ApiTyping.Method.Set:
                    return false;
                case ApiTyping.Method.Notify:
                    this.dispatchNotifyMessage(messageObject);
                    return true;
                case ApiTyping.Method.State:
                    for (const bundle of messageObject.bundles)
                    {
                        for (const data of bundle.data)
                        {
                            const unbundledMessageObject =
                            {
                                method: ApiTyping.Method.Notify,
                                scope: bundle.scope,
                                key: data.key,
                                value: data.value,
                            } as ApiTyping.Notify; // TODO: How could this assertion be avoided?

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

    private dispatchNotifyMessage (messageObject: ApiTyping.Notify): void
    {
        switch (messageObject.scope)
        {
            case ApiTyping.Scope.Global:
                switch (messageObject.key)
                {
                    case ApiTyping.Key.Microphone:
                        this.onNotifyGlobalMicrophone?.(messageObject);
                        return;
                    case ApiTyping.Key.Muted:
                        this.onNotifyGlobalMuted?.(messageObject);
                        return;
                }
            case ApiTyping.Scope.Connection:
                switch (messageObject.key)
                {
                    case ApiTyping.Key.Blender:
                        this.onNotifyConnectionBlender?.(messageObject);
                        return;
                    default:
                        switch (messageObject.key.type)
                        {
                            case ApiTyping.ChannelType.Input:
                            {
                                const inputMessage = {
                                    ...messageObject,
                                    key: messageObject.key,
                                };
                                this.onNotifyConnectionInput?.(inputMessage);
                                return;
                            }
                            case ApiTyping.ChannelType.Output:
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
                    case ApiTyping.Key.CompressorState:
                        this.onNotifyOutputCompressorState?.(messageObject);
                        return;
                    case ApiTyping.Key.CompressorValue:
                        this.onNotifyOutputCompressorValue?.(messageObject);
                        return;
                    case ApiTyping.Key.MicrophoneVolume:
                        this.onNotifyOutputMicrophoneVolume?.(messageObject);
                        return;
                    case ApiTyping.Key.SoundVolume:
                        this.onNotifyOutputSoundVolume?.(messageObject);
                        return;
                    default:
                        this.onNotifyOutputInputVolume?.(messageObject);
                        return;
                }
        }
    }

    private sendMessage (messageObject: ApiTyping.Set): void
    {
        const messageString = JSON.stringify(messageObject);
        this.client.send(messageString);
    }

    public setMuted (value: boolean): void
    {
        const messageObject: ApiTyping.SetGlobalMuted =
        {
            method: ApiTyping.Method.Set,
            scope: ApiTyping.Scope.Global,
            key: ApiTyping.Key.Muted,
            value: value,
        };

        this.sendMessage(messageObject);
    }

    public setMicrophone (enabled: boolean): void
    {
        const messageObject: ApiTyping.SetGlobalMicrophone =
        {
            method: ApiTyping.Method.Set,
            scope: ApiTyping.Scope.Global,
            key: ApiTyping.Key.Microphone,
            value: enabled,
        };

        this.sendMessage(messageObject);
    }

    public setSoundVolume (outputId: number, volume: number): void
    {
        const messageObject: ApiTyping.SetOutputSoundVolume =
        {
            method: ApiTyping.Method.Set,
            scope: {
                type: ApiTyping.ChannelType.Output,
                id: outputId,
            },
            key: ApiTyping.Key.SoundVolume,
            value: volume,
        };

        this.sendMessage(messageObject);
    }

    public setMicrophoneVolume (outputId: number, volume: number): void
    {
        const messageObject: ApiTyping.SetOutputMicrophoneVolume =
        {
            method: ApiTyping.Method.Set,
            scope: {
                type: ApiTyping.ChannelType.Output,
                id: outputId,
            },
            key: ApiTyping.Key.MicrophoneVolume,
            value: volume,
        };

        this.sendMessage(messageObject);
    }

    public setCompressorState (outputId: number, enabled: boolean): void
    {
        const messageObject: ApiTyping.SetOutputCompressorState =
        {
            method: ApiTyping.Method.Set,
            scope: {
                type: ApiTyping.ChannelType.Output,
                id: outputId,
            },
            key: ApiTyping.Key.CompressorState,
            value: enabled,
        };

        this.sendMessage(messageObject);
    }

    public setCompressorValue (outputId: number, value: number): void
    {
        const messageObject: ApiTyping.SetOutputCompressorValue =
        {
            method: ApiTyping.Method.Set,
            scope: {
                type: ApiTyping.ChannelType.Output,
                id: outputId,
            },
            key: ApiTyping.Key.CompressorValue,
            value: value,
        };

        this.sendMessage(messageObject);
    }

    public setInput (outputId: number, inputId: number, value: number): void
    {
        const messageObject: ApiTyping.SetOutputInputVolume =
        {
            method: ApiTyping.Method.Set,
            scope: {
                type: ApiTyping.ChannelType.Output,
                id: outputId,
            },
            key: {
                type: ApiTyping.ChannelType.Input,
                id: inputId,
            },
            value: value,
        };

        this.sendMessage(messageObject);
    }
}
