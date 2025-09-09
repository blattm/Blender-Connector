import * as ApiEvents from './apiEvent';
import * as ApiTyping from './apiTyping';
import * as MessageParser from './messageParser';
import { MessageType } from './messageType';
import type { WebSocketClient } from './websocketClient';

export class ApiHandler
{
    private readonly client: WebSocketClient;

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

    private onMessage (data: string): void
    {
        const message = MessageParser.parse(data);

        if (message === null)
        {
            console.error('ApiHandler: Unable to parse message: ', data);
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

    private sendMessage (messageObject: ApiTyping.ApiSetObject): void
    {
        const messageString = JSON.stringify(messageObject);
        this.client.send(messageString);
    }

    public setMuted (value: boolean): void
    {
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
        const messageObject: ApiTyping.ApiSetObject =
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
