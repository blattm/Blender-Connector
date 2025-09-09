import { BaseElement } from './baseElement';
import { buttonMixing } from './components/buttonComponent';
import { sliderMixing } from './components/sliderComponent';

export class MixerControlElement extends sliderMixing(buttonMixing(BaseElement))
{
    private static readonly template = document.getElementById("mixer-control-template") as HTMLTemplateElement|null;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, MixerControlElement.template);

        this.initialiseSlider(rootElement);
        this.initialiseButton(rootElement);
    }

    public setEnabled (enabled: boolean): void
    {
        this.setSliderEnabled(enabled);
        this.setButtonEnabled(enabled);
    }
}
