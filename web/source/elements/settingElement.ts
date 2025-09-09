import { BaseElement } from './baseElement';
import { buttonMixing } from './components/buttonComponent';
import { sliderMixing } from './components/sliderComponent';

export class SettingElement extends buttonMixing(sliderMixing(BaseElement))
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
