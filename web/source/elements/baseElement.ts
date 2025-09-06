enum ModifierClassNames
{
    Active = "modifier-active",
    Inactive = "modifier-inactive",
}

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

    protected setButtonState (button: HTMLButtonElement, active: boolean): void
    {
        let classToBeRemoved: ModifierClassNames;
        let classToBeAdded: ModifierClassNames;
        if (active)
        {
            classToBeRemoved = ModifierClassNames.Inactive;
            classToBeAdded = ModifierClassNames.Active;
        }
        else
        {
            classToBeRemoved = ModifierClassNames.Active;
            classToBeAdded = ModifierClassNames.Inactive;
        }

        if (button.classList.contains(classToBeRemoved))
        {
            button.classList.remove(classToBeRemoved);
        }

        if (!button.classList.contains(classToBeAdded))
        {
            button.classList.add(classToBeAdded);
        }
    }
}
