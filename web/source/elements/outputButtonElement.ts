import { BaseElement } from './baseElement';
import { buttonMixin } from './mixins/buttonMixin';

export class OutputButtonElement extends buttonMixin(BaseElement)
{
    private static readonly template = document.getElementById("output-button-template") as HTMLTemplateElement|null;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, OutputButtonElement.template);

        this.initialiseButton(rootElement);
    }
}
