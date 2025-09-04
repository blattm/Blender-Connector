import { BaseElement } from './baseElement';

export class SettingElement extends BaseElement
{
    private static template = document.getElementById("setting-template") as HTMLTemplateElement|null;

    private button: HTMLButtonElement;
    private slider: HTMLInputElement;

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
    }

    public setSliderValue (value: number): void
    {
        this.slider.value = value.toString();
    }

    public setButtonLabel (label: string): void
    {
        this.button.textContent = label;
    }
}
