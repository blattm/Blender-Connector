import { BaseElement } from './baseElement';

export class SettingElement extends BaseElement
{
    private static template = document.getElementById("setting-template") as HTMLTemplateElement|null;

    private button: HTMLButtonElement;
    private slider: HTMLInputElement;

    private sliderMaximum: number;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, SettingElement.template);

        const buttonElement = rootElement.firstElementChild;
        if (buttonElement === null || !(buttonElement instanceof HTMLButtonElement))
        {
            throw new Error("Button element not found in SettingElement template.");
        }
        this.button = buttonElement;

        const sliderElement = rootElement.lastElementChild;
        if (sliderElement === null || !(sliderElement instanceof HTMLInputElement) || sliderElement.type !== "range")
        {
            throw new Error("Slider element not found in SettingElement template.");
        }
        this.slider = sliderElement;

        this.sliderMaximum = Number.parseFloat(sliderElement.max);
    }

    public setButtonLabel (label: string): void
    {
        this.button.textContent = label;
    }

    public setState (state: boolean): void
    {
        this.setButtonState(this.button, state);
    }

    public setValue (value: number): void
    {
        this.slider.value = (value * this.sliderMaximum).toString();
    }
}
