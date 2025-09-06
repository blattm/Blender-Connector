import { BaseElement } from './baseElement';

export class MixerControlElement extends BaseElement
{
    private static template = document.getElementById("mixer-control-template") as HTMLTemplateElement|null;

    private slider: HTMLInputElement;
    private button: HTMLButtonElement;

    private sliderMaximum: number;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, MixerControlElement.template);

        const sliderElement = rootElement.firstElementChild;
        if (sliderElement === null || !(sliderElement instanceof HTMLInputElement) || sliderElement.type !== "range")
        {
            throw new Error("Slider element not found in MixerControl template");
        }
        this.slider = sliderElement;

        const buttonElement = rootElement.lastElementChild;
        if (buttonElement === null || !(buttonElement instanceof HTMLButtonElement))
        {
            throw new Error("Button element not found in MixerControl template");
        }
        this.button = buttonElement;

        // TODO: Duplicate code from SettingElement:
        this.sliderMaximum = Number.parseFloat(sliderElement.max);
    }

    public setValue (value: number): void
    {
        // TODO: Duplicate code from SettingElement:
        this.slider.value = (value * this.sliderMaximum).toString();
    }

    public setButtonLabel (label: string): void
    {
        this.button.textContent = label;
    }

    public setEnabled (enabled: boolean): void
    {
        this.slider.disabled = !enabled;
    }
}
