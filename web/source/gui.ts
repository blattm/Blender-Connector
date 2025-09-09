import * as Utility from './common/utility';
import { MixerControlElement } from './elements/mixerControlElement';
import { OutputButtonElement } from './elements/outputButtonElement';
import { SettingElement } from './elements/settingElement';

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

    private initialiseOutputButtons (outputCount: number): OutputButtonElement[]
    {
        const inputButtons: OutputButtonElement[] = [];
        const inputContainer = document.getElementById("output-container");
        if (inputContainer === null)
        {
            throw new Error("Input container not found.");
        }

        for (let i = 0; i < outputCount; i++)
        {
            const inputButton = new OutputButtonElement(inputContainer);
            inputButton.setLabel(`O${i + 1}`);
            inputButtons.push(inputButton);
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

        for (let i = 0; i < inputCount; i++)
        {
            const mixerControl = new MixerControlElement(mixerContainer);
            mixerControls.push(mixerControl);
            mixerControl.setButtonLabel(`I${i + 1}`);
        }

        return mixerControls;
    }

    private update<T> (outputId: number, array: T[], value: T, setter: (value: T) => void): void
    {
        array[outputId] = value;

        if (outputId === this.activeOutputId)
        {
            setter(value);
        }
    }

    public setMute (value: boolean): void
    {
        this.muteSetting.setState(value);
    }

    public setOutputVolume (outputId: number, value: number): void
    {
        this.update(outputId, this.outputVolumes, value, this.muteSetting.setValue.bind(this.muteSetting));
    }

    public setMicrophone (value: boolean): void
    {
        this.microphoneSetting.setState(value);
    }

    public setMicrophoneVolume (outputId: number, value: number): void
    {
        this.update(outputId, this.microphoneVolumes, value, this.microphoneSetting.setValue.bind(this.microphoneSetting));
    }

    public setOutputConnection (outputId: number, value: boolean): void
    {
        this.outputButtons[outputId].setEnabled(value);

        // TODO: Should we switch automatically to the next available output or disable all elements?
    }

    public setInputConnection (inputId: number, value: boolean): void
    {
        this.inputControls[inputId].setEnabled(value);
    }

    public setInputVolume (outputId: number, inputId: number, value: number): void
    {
        this.inputVolumes[outputId][inputId] = value;

        if (outputId === this.activeOutputId)
        {
            this.inputControls[inputId].setValue(value);
        }
    }

    public setCompressorState (outputId: number, value: boolean): void
    {
        this.update(outputId, this.compressorStates, value, this.compressorSetting.setState.bind(this.compressorSetting));
    }

    public setCompressorValue (outputId: number, value: number): void
    {
        this.update(outputId, this.compressorValues, value, this.compressorSetting.setValue.bind(this.compressorSetting));
    }
}
