export abstract class BaseElement
{
    protected instantiateTemplate (parent: Node, template: HTMLTemplateElement|null): HTMLElement
    {
        if (template === null)
        {
            throw new Error("Element template not found.");
        }

        const documentFragment = template.content.cloneNode(true);
        if (!(documentFragment instanceof DocumentFragment))
        {
            throw new Error("Failed to clone element template.");
        }

        const rootElement = documentFragment.firstElementChild;
        if (!(rootElement instanceof HTMLElement))
        {
            throw new Error("Element template content is not an HTMLElement.");
        }

        parent.appendChild(documentFragment);

        return rootElement;
    }
}
