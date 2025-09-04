import { BaseElement } from './baseElement';

export class InputButtonElement extends BaseElement
{
    private static template = document.getElementById("input-button-template") as HTMLTemplateElement|null;

    private button: HTMLButtonElement;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, InputButtonElement.template);
        if (!(rootElement instanceof HTMLButtonElement))
        {
            throw new Error("Root element is not a button in input-button-template.");
        }

        this.button = rootElement;
    }

    public setButtonLabel (label: string): void
    {
        this.button.textContent = label;
    }
}
