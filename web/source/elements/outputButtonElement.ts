import { BaseElement } from './baseElement';
import { buttonMixing } from './components/buttonComponent';

export class OutputButtonElement extends buttonMixing(BaseElement)
{
    private static readonly template = document.getElementById("output-button-template") as HTMLTemplateElement|null;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, OutputButtonElement.template);

        this.initialiseButton(rootElement);
    }
}
