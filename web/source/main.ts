import * as ApiEvents from './api/apiEvent';
import { ApiHandler } from './api/apiHandler';
import { MixerControlElement } from './elements/mixerControlElement';
import { OutputButtonElement } from './elements/outputButtonElement';
import { SettingElement } from './elements/settingElement';
import { WebSocketClient } from './api/websocketClient';

class Main
{
    private static readonly webSocketAddress = "localhost:8081";
    private static readonly mixerCount = 6;

    private muteSetting: SettingElement;
    private microphoneSetting: SettingElement;
    private compressorSetting: SettingElement;
    private outputButtons: OutputButtonElement[];
    private mixerControls: MixerControlElement[];

    private apiHandler: ApiHandler;
    private webSocketClient: WebSocketClient;

    private state: ApiEvents.State;
    private activeOutputId: number;

    constructor ()
    {
        [this.muteSetting, this.microphoneSetting] = this.initialiseGlobalSettings();
        [this.compressorSetting] = this.initialiseLocalSettings();
        this.outputButtons = this.initialiseOutputButtons();
        this.mixerControls = this.initialiseMixers();

        this.state = null!; // One hack is allowed... it's okay if it throws should the api handle initialisation incorrectly.
        this.activeOutputId = 0;

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

    private initialiseGlobalSettings (): [muteSetting: SettingElement, roomMicrophoneSetting: SettingElement]
    {
        const globalSettingsContainer = document.getElementById("global-settings-container");
        if (globalSettingsContainer === null)
        {
            throw new Error("Global settings container not found.");
        }

        const muteSetting = new SettingElement(globalSettingsContainer);
        muteSetting.setButtonLabel("Mute");

        const roomMicrophoneSetting = new SettingElement(globalSettingsContainer);
        roomMicrophoneSetting.setButtonLabel("Microphone");

        return [muteSetting, roomMicrophoneSetting];
    }

    private initialiseLocalSettings (): [compressorSetting: SettingElement]
    {
        const localSettingsContainer = document.getElementById("local-settings-container");
        if (localSettingsContainer === null)
        {
            throw new Error("Local settings container not found.");
        }

        const compressorSetting = new SettingElement(localSettingsContainer);
        compressorSetting.setButtonLabel("Compressor");

        return [compressorSetting];
    }

    private initialiseOutputButtons (): OutputButtonElement[]
    {
        const inputButtons: OutputButtonElement[] = [];
        const inputContainer = document.getElementById("output-container");
        if (inputContainer === null)
        {
            throw new Error("Input container not found.");
        }

        const buttonLabels = ["A", "B", "C", "D"]; // TODO: This is bad and should be handled like the mixers count.
        for (const label of buttonLabels)
        {
            const inputButton = new OutputButtonElement(inputContainer);
            inputButton.setLabel(label);
            inputButtons.push(inputButton);
        }

        return inputButtons;
    }

    private initialiseMixers (): MixerControlElement[]
    {
        const mixerControls: MixerControlElement[] = [];
        const mixerContainer = document.getElementById("mixer-container");
        if (mixerContainer === null)
        {
            throw new Error("Mixer container not found.");
        }

        for (let i = 0; i < Main.mixerCount; i++)
        {
            const mixerControl = new MixerControlElement(mixerContainer);
            mixerControls.push(mixerControl);
            mixerControl.setButtonLabel(`${i + 1}`);
        }

        return mixerControls;
    }

    private onNotifyGlobalMicrophone (message: ApiEvents.GlobalMicrophone): void
    {
        this.state.globalMicrophone = message;

        this.microphoneSetting.setState(message.value);
    }

    private onNotifyGlobalMuted (message: ApiEvents.GlobalMuted): void
    {
        this.state.globalMuted = message;

        this.muteSetting.setState(message.value);
    }

    // TODO: It should be able to abstract over the following very similar functions, shouldn't it?

    private onNotifyOutputCompressorState (message: ApiEvents.OutputCompressorState): void
    {
        this.verifyOutputId(message.outputId);

        this.state.outputCompressorStates[message.outputId] = message;

        if (message.outputId === this.activeOutputId)
        {
            this.compressorSetting.setState(message.value);
        }
    }

    private onNotifyOutputCompressorValue (message: ApiEvents.OutputCompressorValue): void
    {
        this.verifyOutputId(message.outputId);

        this.state.outputCompressorValues[message.outputId] = message;

        if (message.outputId === this.activeOutputId)
        {
            this.compressorSetting.setValue(message.value);
        }
    }

    private onNotifyOutputInputVolume (message: ApiEvents.OutputInputVolume): void
    {
        this.verifyOutputId(message.outputId);
        this.verifyInputId(message.inputId);

        this.state.outputInputVolumes[message.outputId][message.inputId] = message;

        if (message.outputId === this.activeOutputId)
        {
            this.mixerControls[message.outputId].setValue(message.value);
        }
    }

    private onNotifyOutputMicrophoneVolume (message: ApiEvents.OutputMicrophoneVolume): void
    {
        this.verifyOutputId(message.outputId);

        this.state.outputMicrophoneVolumes[message.outputId] = message;

        if (message.outputId === this.activeOutputId)
        {
            this.mixerControls[message.outputId].setValue(message.value);
        }
    }

    private onNotifyOutputSoundVolume (message: ApiEvents.OutputSoundVolume): void
    {
        this.verifyOutputId(message.outputId);

        this.state.outputSoundVolumes[message.outputId] = message;

        if (message.outputId === this.activeOutputId)
        {
            this.mixerControls[message.outputId].setValue(message.value);
        }
    }

    private onNotifyConnectionBlender (message: ApiEvents.ConnectionBlender): void
    {
        this.state.connectionBlender = message;

        console.warn("Blender connection event received, but not handled.");
        // TODO: Implement.
    }

    private onNotifyConnectionInput (message: ApiEvents.ConnectionInput): void
    {
        this.verifyInputId(message.inputId);

        this.state.connectionInputs[message.inputId] = message;

        this.outputButtons[message.inputId].setEnabled(message.value);
    }

    private onNotifyConnectionOutput (message: ApiEvents.ConnectionOutput): void
    {
        this.verifyOutputId(message.outputId);

        this.state.connectionOutputs[message.outputId] = message;

        this.mixerControls[message.outputId].setEnabled(message.value);
    }

    private onState (message: ApiEvents.State): void
    {
        this.state = message;

        console.log("State received:", message);

        // TODO: This method mimics the onNotify methods. That's a bit unpleasant. How could it be improved?

        this.microphoneSetting.setState(this.state.globalMicrophone.value);
        this.muteSetting.setState(this.state.globalMuted.value);

        for (const connectionInput of this.state.connectionInputs)
        {
            this.verifyInputId(connectionInput.inputId);

            this.mixerControls[connectionInput.inputId].setEnabled(connectionInput.value);
        }

        for (const connectionOutput of this.state.connectionOutputs)
        {
            this.verifyOutputId(connectionOutput.outputId);

            this.outputButtons[connectionOutput.outputId].setEnabled(connectionOutput.value);
        }

        // TODO: Set blender connection state.

        this.compressorSetting.setState(this.state.outputCompressorStates[this.activeOutputId].value);
        this.compressorSetting.setValue(this.state.outputCompressorValues[this.activeOutputId].value);

        for (const outputInputVolume of this.state.outputInputVolumes[this.activeOutputId])
        {
            this.verifyOutputId(outputInputVolume.outputId);
            this.verifyInputId(outputInputVolume.inputId);
            this.mixerControls[outputInputVolume.inputId].setValue(outputInputVolume.value);
        }

        const outputMicrophoneVolume = this.state.outputMicrophoneVolumes[this.activeOutputId];
        this.verifyOutputId(outputMicrophoneVolume.outputId);
        this.microphoneSetting.setValue(outputMicrophoneVolume.value);

        const outputSoundVolume = this.state.outputSoundVolumes[this.activeOutputId];
        this.verifyOutputId(outputSoundVolume.outputId);
        this.muteSetting.setValue(outputSoundVolume.value);
    }

    private verifyInputId (inputId: number): void
    {
        if (inputId < 0 || inputId >= this.mixerControls.length || !Number.isInteger(inputId))
        {
            throw new Error(`Input ID ${inputId} is out of range.`);
        }
    }

    private verifyOutputId (outputId: number): void
    {
        if (outputId < 0 || outputId >= this.outputButtons.length || !Number.isInteger(outputId))
        {
            throw new Error(`Output ID ${outputId} is out of range.`);
        }
    }
}

const main = new Main();
main.run();
