import * as ApiMessages from './api/apiMessage';
import { ApiHandler } from './api/apiHandler';
import { Gui } from './gui';
import { WebSocketClient } from './api/websocketClient';

class Main
{
    private static readonly webSocketAddress = "localhost:8081";
    private static readonly outputCount = 4;
    private static readonly inputCount = 6;

    private readonly gui: Gui;
    private readonly apiHandler: ApiHandler;
    private readonly webSocketClient: WebSocketClient;

    constructor ()
    {
        this.gui = new Gui(Main.inputCount, Main.outputCount);

        this.webSocketClient = new WebSocketClient();
        this.apiHandler = new ApiHandler(this.webSocketClient);

        this.apiHandler.onNotifyGlobalMicrophone = this.onNotifyGlobalMicrophone.bind(this);
        this.apiHandler.onNotifyGlobalMuted = this.onNotifyGlobalMuted.bind(this);
        this.apiHandler.onNotifyOutputCompressorState = this.onNotifyOutputCompressorState.bind(this);
        this.apiHandler.onNotifyOutputCompressorValue = this.onNotifyOutputCompressorValue.bind(this);
        this.apiHandler.onNotifyOutputInputVolume = this.onNotifyOutputInputVolume.bind(this);
        this.apiHandler.onNotifyOutputMicrophoneVolume = this.onNotifyOutputMicrophoneVolume.bind(this);
        this.apiHandler.onNotifyOutputSoundVolume = this.onNotifyOutputSoundVolume.bind(this);
        this.apiHandler.onNotifyConnectionBlender = this.onNotifyConnectionBlender.bind(this);
        this.apiHandler.onNotifyConnectionInput = this.onNotifyConnectionInput.bind(this);
        this.apiHandler.onNotifyConnectionOutput = this.onNotifyConnectionOutput.bind(this);

        this.gui.onMicrophoneChanged = this.apiHandler.setMicrophone.bind(this.apiHandler);
        this.gui.onMuteChanged = this.apiHandler.setMuted.bind(this.apiHandler);
        this.gui.onCompressorStateChanged = this.apiHandler.setCompressorState.bind(this.apiHandler);
        this.gui.onCompressorValueChanged = this.apiHandler.setCompressorValue.bind(this.apiHandler);
        this.gui.onInputVolumeChanged = this.apiHandler.setInput.bind(this.apiHandler);
        this.gui.onMicrophoneVolumeChanged = this.apiHandler.setMicrophoneVolume.bind(this.apiHandler);
        this.gui.onOutputVolumeChanged = this.apiHandler.setSoundVolume.bind(this.apiHandler);
    }

    public run (): void
    {
        this.webSocketClient.connect(Main.webSocketAddress);
    }

    private onNotifyGlobalMicrophone (message: ApiMessages.NotifyGlobalMicrophone): void
    {
        this.gui.setMicrophone(message.value);
    }

    private onNotifyGlobalMuted (message: ApiMessages.NotifyGlobalMuted): void
    {
        this.gui.setMute(message.value);
    }

    private onNotifyOutputCompressorState (message: ApiMessages.NotifyOutputCompressorState): void
    {
        this.verifyOutputId(message.scope.id);
        this.gui.setCompressorState(message.scope.id, message.value);
    }

    private onNotifyOutputCompressorValue (message: ApiMessages.NotifyOutputCompressorValue): void
    {
        this.verifyOutputId(message.scope.id);
        this.gui.setCompressorValue(message.scope.id, message.value);
    }

    private onNotifyOutputInputVolume (message: ApiMessages.NotifyOutputInputVolume): void
    {
        this.verifyOutputId(message.scope.id);
        this.verifyInputId(message.key.id);

        this.gui.setInputVolume(message.scope.id, message.key.id, message.value);
    }

    private onNotifyOutputMicrophoneVolume (message: ApiMessages.NotifyOutputMicrophoneVolume): void
    {
        this.verifyOutputId(message.scope.id);
        this.gui.setMicrophoneVolume(message.scope.id, message.value);
    }

    private onNotifyOutputSoundVolume (message: ApiMessages.NotifyOutputSoundVolume): void
    {
        this.verifyOutputId(message.scope.id);
        this.gui.setOutputVolume(message.scope.id, message.value);
    }

    private onNotifyConnectionBlender (message: ApiMessages.NotifyConnectionBlender): void
    {
        console.warn("Blender connection event received, but not handled: ", message); // TODO: Implement.
    }

    private onNotifyConnectionInput (message: ApiMessages.NotifyConnectionInput): void
    {
        this.verifyInputId(message.key.id);
        this.gui.setInputConnection(message.key.id, message.value);
    }

    private onNotifyConnectionOutput (message: ApiMessages.NotifyConnectionOutput): void
    {
        this.verifyOutputId(message.key.id);
        this.gui.setOutputConnection(message.key.id, message.value);
    }

    private verifyInputId (inputId: number): void
    {
        if (inputId < 0 || inputId >= Main.inputCount || !Number.isInteger(inputId))
        {
            throw new Error(`Input ID ${inputId} is out of range.`);
        }
    }

    private verifyOutputId (outputId: number): void
    {
        if (outputId < 0 || outputId >= Main.outputCount || !Number.isInteger(outputId))
        {
            throw new Error(`Output ID ${outputId} is out of range.`);
        }
    }
}

const main = new Main();
main.run();
