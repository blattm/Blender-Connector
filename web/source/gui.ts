import * as Utility from './common/utility';
import { MixerControlElement } from './elements/mixerControlElement';
import { OutputButtonElement } from './elements/outputButtonElement';
import { SettingElement } from './elements/settingElement';

/**
 * Provides an interface to the GUI, i.e. creating and updating HTML elements.
 */
export class Gui
{
    private readonly muteSetting: SettingElement;
    private readonly microphoneSetting: SettingElement;
    private readonly compressorSetting: SettingElement;
    private readonly outputButtons: OutputButtonElement[];
    private readonly inputControls: MixerControlElement[];

    /** The currently active output ID. */
    private activeOutputId: number;

    /** Stores the volume level per output ID. */
    private readonly outputVolumes: number[];
    /** Stores the microphone volume level per output ID. */
    private readonly microphoneVolumes: number[];
    /**
     * Stores the connection state of every input ID per output ID.
     * @example inputVolumes[outputId][inputId] = volume;
     */
    private readonly inputVolumes: number[][];
    /** Stores the compressor state per output ID. */
    private readonly compressorStates: boolean[];
    /** Stores the compressor value per output ID. */
    private readonly compressorValues: number[];

    public set onMuteChanged (handler: ((value: boolean) => void))
    {
        this.muteSetting.onButtonClicked = (): void =>
        {
            handler(this.muteSetting.buttonState);
        };
    }

    public set onOutputVolumeChanged (handler: ((outputId: number, value: number) => void))
    {
        this.muteSetting.onSliderChanged = (): void =>
        {
            this.outputVolumes[this.activeOutputId] = this.muteSetting.sliderValue;
            handler(this.activeOutputId, this.muteSetting.sliderValue);
        };
    }

    public set onMicrophoneChanged (handler: ((value: boolean) => void))
    {
        this.microphoneSetting.onButtonClicked = (): void =>
        {
            handler(this.microphoneSetting.buttonState);
        };
    }

    public set onMicrophoneVolumeChanged (handler: ((outputId: number, value: number) => void))
    {
        this.microphoneSetting.onSliderChanged = (): void =>
        {
            this.microphoneVolumes[this.activeOutputId] = this.microphoneSetting.sliderValue;
            handler(this.activeOutputId, this.microphoneSetting.sliderValue);
        };
    }

    public set onInputVolumeChanged (handler: ((outputId: number, inputId: number, value: number) => void))
    {
        for (let inputId = 0; inputId < this.inputControls.length; inputId++)
        {
            const inputControl = this.inputControls[inputId];

            inputControl.onSliderChanged = (): void =>
            {
                this.inputVolumes[this.activeOutputId][inputId] = inputControl.sliderValue;
                handler(this.activeOutputId, inputId, inputControl.sliderValue);
            };
        }
    }

    public set onCompressorStateChanged (handler: ((outputId: number, value: boolean) => void))
    {
        this.compressorSetting.onButtonClicked = (): void =>
        {
            this.compressorStates[this.activeOutputId] = this.compressorSetting.buttonState;
            handler(this.activeOutputId, this.compressorSetting.buttonState);
        };
    }

    public set onCompressorValueChanged (handler: ((outputId: number, value: number) => void))
    {
        this.compressorSetting.onSliderChanged = (): void =>
        {
            this.compressorValues[this.activeOutputId] = this.compressorSetting.sliderValue;
            handler(this.activeOutputId, this.compressorSetting.sliderValue);
        };
    }

    constructor (inputCount: number, outputCount: number)
    {
        [this.muteSetting, this.microphoneSetting] = this.initialiseGlobalSettings();
        [this.compressorSetting] = this.initialiseLocalSettings();
        this.outputButtons = this.initialiseOutputButtons(outputCount);
        this.inputControls = this.initialiseMixers(inputCount);

        this.activeOutputId = 0;
        this.outputVolumes = new Array<number>(outputCount).fill(0);
        this.microphoneVolumes = new Array<number>(outputCount).fill(0);
        this.inputVolumes = Utility.initialiseArrayOfArrays<number>(outputCount, inputCount, 0);
        this.compressorStates = new Array<boolean>(outputCount).fill(false);
        this.compressorValues = new Array<number>(outputCount).fill(0);
    }

    private initialiseGlobalSettings (): [muteSetting: SettingElement, roomMicrophoneSetting: SettingElement]
    {
        const globalSettingsContainer = document.getElementById("global-settings-container");
        if (globalSettingsContainer === null)
        {
            throw new Error("Global settings container not found.");
        }

        const muteSetting = new SettingElement(globalSettingsContainer);
        muteSetting.buttonLabel = "Mute";

        const roomMicrophoneSetting = new SettingElement(globalSettingsContainer);
        roomMicrophoneSetting.buttonLabel = "Microphone";

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
        compressorSetting.buttonLabel = "Compressor";

        return [compressorSetting];
    }

    private initialiseOutputButtons (outputCount: number): OutputButtonElement[]
    {
        const inputButtons: OutputButtonElement[] = [];
        const inputContainer = document.getElementById("output-container");
        if (inputContainer === null)
        {
            throw new Error("Input container not found.");
        }

        for (let outputId = 0; outputId < outputCount; outputId++)
        {
            const outputButton = new OutputButtonElement(inputContainer);
            outputButton.buttonLabel = `O${outputId + 1}`;
            outputButton.buttonState = (outputId === 0);
            outputButton.onButtonClicked = this.changeActiveOutput.bind(this, outputId);

            inputButtons.push(outputButton);
        }

        return inputButtons;
    }

    private initialiseMixers (inputCount: number): MixerControlElement[]
    {
        const mixerControls: MixerControlElement[] = [];
        const mixerContainer = document.getElementById("mixer-container");
        if (mixerContainer === null)
        {
            throw new Error("Mixer container not found.");
        }

        for (let inputId = 0; inputId < inputCount; inputId++)
        {
            const mixerControl = new MixerControlElement(mixerContainer);
            mixerControls.push(mixerControl);
            mixerControl.buttonLabel = `I${inputId + 1}`;
        }

        return mixerControls;
    }

    /**
     * Enable or disable the muting.
     * @param value True to mute, false to unmute.
     */
    public setMute (value: boolean): void
    {
        this.muteSetting.buttonState = value;
    }

    /**
     * Set the volume for a specific output.
     * @param outputId The output ID.
     * @param value The volume level, ranges from 0.0 to 1.0.
     */
    public setOutputVolume (outputId: number, value: number): void
    {
        this.outputVolumes[outputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.muteSetting.sliderValue = value;
        }
    }

    /**
     * Enable or disable the microphone.
     * @param value True to enable, false to disable.
     */
    public setMicrophone (value: boolean): void
    {
        this.microphoneSetting.buttonState = value;
    }

    /**
     * Set the microphone volume for a specific output.
     * @param outputId The output ID.
     * @param value The volume level, ranges from 0.0 to 1.0.
     */
    public setMicrophoneVolume (outputId: number, value: number): void
    {
        this.microphoneVolumes[outputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.microphoneSetting.sliderValue = value;
        }
    }

    /** Enable or disable the connection to a specific output.
     * @param outputId The output ID.
     * @param value True to enable, false to disable.
     */
    public setOutputConnection (outputId: number, value: boolean): void
    {
        this.outputButtons[outputId].buttonEnabled = value;

        // TODO: Should we switch automatically to the next available output or disable all elements?
    }

    /**
     * Enable or disable the connection to a specific input.
     * @param inputId The input ID.
     * @param value True to enable, false to disable.
     */
    public setInputConnection (inputId: number, value: boolean): void
    {
        this.inputControls[inputId].enabled = value;
    }

    /**
     * Set the volume for a specific input on a specific output.
     * @param outputId The output ID.
     * @param inputId The input ID.
     * @param value The volume level, ranges from 0.0 to 1.0.
     */
    public setInputVolume (outputId: number, inputId: number, value: number): void
    {
        this.inputVolumes[outputId][inputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.inputControls[inputId].sliderValue = value;
        }
    }

    /** Enable or disable the compressor for a specific output.
     * @param outputId The output ID.
     * @param value True to enable, false to disable.
     */
    public setCompressorState (outputId: number, value: boolean): void
    {
        this.compressorStates[outputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.compressorSetting.buttonState = value;
        }
    }

    /**
     * Set the compressor value for a specific output.
     * @param outputId The output ID.
     * @param value The compressor value, ranges from 0.0 to 1.0.
     */
    public setCompressorValue (outputId: number, value: number): void
    {
        this.compressorValues[outputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.compressorSetting.sliderValue = value;
        }
    }

    private changeActiveOutput (newOutputId: number): void
    {
        if (newOutputId === this.activeOutputId)
        {
            return;
        }

        this.outputButtons[this.activeOutputId].buttonState = false;
        this.activeOutputId = newOutputId;
        this.outputButtons[this.activeOutputId].buttonState = true;

        this.muteSetting.sliderValue = this.outputVolumes[this.activeOutputId];
        this.microphoneSetting.sliderValue = this.microphoneVolumes[this.activeOutputId];
        for (let inputId = 0; inputId < this.inputControls.length; inputId++)
        {
            this.inputControls[inputId].sliderValue = this.inputVolumes[this.activeOutputId][inputId];
        }
        this.compressorSetting.buttonState = this.compressorStates[this.activeOutputId];
        this.compressorSetting.sliderValue = this.compressorValues[this.activeOutputId];
    }
}
