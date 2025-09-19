import { BaseElement } from './baseElement';
import { buttonMixin } from './mixins/buttonMixin';
import { sliderMixin } from './mixins/sliderMixin';

export class SettingElement extends buttonMixin(sliderMixin(BaseElement))
{
    private static readonly template = document.getElementById("setting-template") as HTMLTemplateElement|null;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, SettingElement.template);

        this.initialiseButton(rootElement);
        this.initialiseSlider(rootElement);
    }
}
