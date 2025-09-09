import * as ApiEvents from './api/apiEvent';
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
        this.apiHandler.onState = this.onState.bind(this);
    }

    public run (): void
    {
        this.webSocketClient.connect(Main.webSocketAddress);
    }

    private onNotifyGlobalMicrophone (message: ApiEvents.GlobalMicrophone): void
    {
        this.gui.setMicrophone(message.value);
    }

    private onNotifyGlobalMuted (message: ApiEvents.GlobalMuted): void
    {
        this.gui.setMute(message.value);
    }

    private onNotifyOutputCompressorState (message: ApiEvents.OutputCompressorState): void
    {
        this.verifyOutputId(message.outputId);
        this.gui.setCompressorState(message.outputId, message.value);
    }

    private onNotifyOutputCompressorValue (message: ApiEvents.OutputCompressorValue): void
    {
        this.verifyOutputId(message.outputId);
        this.gui.setCompressorValue(message.outputId, message.value);
    }

    private onNotifyOutputInputVolume (message: ApiEvents.OutputInputVolume): void
    {
        this.verifyOutputId(message.outputId);
        this.verifyInputId(message.inputId);

        this.gui.setInputVolume(message.outputId, message.inputId, message.value);
    }

    private onNotifyOutputMicrophoneVolume (message: ApiEvents.OutputMicrophoneVolume): void
    {
        this.verifyOutputId(message.outputId);
        this.gui.setMicrophoneVolume(message.outputId, message.value);
    }

    private onNotifyOutputSoundVolume (message: ApiEvents.OutputSoundVolume): void
    {
        this.verifyOutputId(message.outputId);
        this.gui.setOutputVolume(message.outputId, message.value);
    }

    private onNotifyConnectionBlender (message: ApiEvents.ConnectionBlender): void
    {
        console.warn("Blender connection event received, but not handled: ", message); // TODO: Implement.
    }

    private onNotifyConnectionInput (message: ApiEvents.ConnectionInput): void
    {
        this.verifyInputId(message.inputId);
        this.gui.setInputConnection(message.inputId, message.value);
    }

    private onNotifyConnectionOutput (message: ApiEvents.ConnectionOutput): void
    {
        this.verifyOutputId(message.outputId);
        this.gui.setOutputConnection(message.outputId, message.value);
    }

    private onState (message: ApiEvents.State): void
    {
        this.onNotifyGlobalMicrophone(message.globalMicrophone);
        this.onNotifyGlobalMuted(message.globalMuted);

        for (const outputCompressorState of message.outputCompressorStates)
        {
            this.onNotifyOutputCompressorState(outputCompressorState);
        }

        for (const outputCompressorValue of message.outputCompressorValues)
        {
            this.onNotifyOutputCompressorValue(outputCompressorValue);
        }

        for (const outputInputVolumes of message.outputInputVolumes)
        {
            for (const outputInputVolume of outputInputVolumes)
            {
                this.onNotifyOutputInputVolume(outputInputVolume);
            }
        }

        for (const outputMicrophoneVolume of message.outputMicrophoneVolumes)
        {
            this.onNotifyOutputMicrophoneVolume(outputMicrophoneVolume);
        }

        for (const outputSoundVolume of message.outputSoundVolumes)
        {
            this.onNotifyOutputSoundVolume(outputSoundVolume);
        }

        this.onNotifyConnectionBlender(message.connectionBlender);

        for (const connectionInput of message.connectionInputs)
        {
            this.onNotifyConnectionInput(connectionInput);
        }

        for (const connectionOutput of message.connectionOutputs)
        {
            this.onNotifyConnectionOutput(connectionOutput);
        }
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
