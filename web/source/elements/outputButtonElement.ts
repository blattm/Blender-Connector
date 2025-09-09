import { BaseElement } from './baseElement';

export class OutputButtonElement extends BaseElement
{
    private static readonly template = document.getElementById("output-button-template") as HTMLTemplateElement|null;

    private readonly button: HTMLButtonElement;

    constructor (parent: Node)
    {
        super();

        const rootElement = this.instantiateTemplate(parent, OutputButtonElement.template);
        if (!(rootElement instanceof HTMLButtonElement))
        {
            throw new Error("Root element is not a button in output-button-template.");
        }

        this.button = rootElement;
    }

    public setLabel (label: string): void
    {
        this.button.textContent = label;
    }

    public setEnabled (enabled: boolean): void
    {
        this.button.disabled = !enabled;
    }
}
