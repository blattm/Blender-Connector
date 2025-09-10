import { BaseElement } from './baseElement';
import { buttonMixin } from './mixins/buttonMixin';
import { sliderMixin } from './mixins/sliderMixin';

export class MixerControlElement extends sliderMixin(buttonMixin(BaseElement))
{
    private static readonly template = document.getElementById("mixer-control-template") as HTMLTemplateElement|null;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, MixerControlElement.template);

        this.initialiseSlider(rootElement);
        this.initialiseButton(rootElement);
    }

    public set enabled (enabled: boolean)
    {
        this.sliderEnabled = enabled;
        this.buttonEnabled = enabled;
    }
}
