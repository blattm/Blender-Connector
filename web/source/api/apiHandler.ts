import * as ApiEvents from './apiEvent';
import * as MessageParser from './messageParser';
import { MessageType } from './messageType';
import { NotImplementedError } from '../common/notImplementedError';
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
