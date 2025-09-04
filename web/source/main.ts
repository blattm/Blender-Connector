import { InputButtonElement } from './elements/inputButtonElement';
import { MixerControlElement } from './elements/mixerControlElement';
import { SettingElement } from './elements/settingElement';

class Main
{
    private static readonly mixerCount = 6;

    private muteSetting: SettingElement;
    private roomMicrophoneSetting: SettingElement;
    private compressorSetting: SettingElement;
    private inputButtons: InputButtonElement[];
    private mixerControls: MixerControlElement[];

    constructor ()
    {
        [this.muteSetting, this.roomMicrophoneSetting] = this.initialiseGlobalSettings();
        [this.compressorSetting] = this.initialiseLocalSettings();
        this.inputButtons = this.initialiseInputButtons();
        this.mixerControls = this.initialiseMixers();
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
        muteSetting.setSliderValue(100);

        const roomMicrophoneSetting = new SettingElement(globalSettingsContainer);
        roomMicrophoneSetting.setButtonLabel("Room Microphone");
        roomMicrophoneSetting.setSliderValue(100);

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
        compressorSetting.setSliderValue(50);

        return [compressorSetting];
    }

    private initialiseInputButtons (): InputButtonElement[]
    {
        const inputButtons: InputButtonElement[] = [];
        const inputContainer = document.getElementById("input-container");
        if (inputContainer === null)
        {
            throw new Error("Input container not found.");
        }

        const buttonLabels = ["A", "B", "C", "D"];
        for (const label of buttonLabels)
        {
            const inputButton = new InputButtonElement(inputContainer);
            inputButton.setButtonLabel(label);
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

    public run (): void
    {
        console.log("Hello World!");
    }
}

const main = new Main();
main.run();
