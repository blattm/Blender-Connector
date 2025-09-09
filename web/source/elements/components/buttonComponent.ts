import type { Constructor } from '../../common/constructorConstraint';

enum ModifierClassNames
{
    Active = "modifier-active",
    Inactive = "modifier-inactive",
}

export class ButtonComponent
{
    private readonly button: HTMLButtonElement;

    constructor (rootElement: HTMLElement)
    {
        const buttonElement = rootElement.querySelector('button');

        if (buttonElement === null)
        {
            throw new Error("Button element not found in template.");
        }

        this.button = buttonElement;
    }

    public setLabel (label: string): void
    {
        this.button.textContent = label;
    }

    public setEnabled (enabled: boolean): void
    {
        this.button.disabled = !enabled;
    }

    public setState (active: boolean): void
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

        if (this.button.classList.contains(classToBeRemoved))
        {
            this.button.classList.remove(classToBeRemoved);
        }

        if (!this.button.classList.contains(classToBeAdded))
        {
            this.button.classList.add(classToBeAdded);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buttonMixing<TBase extends Constructor> (base: TBase)
{
    return class extends base
    {
        private buttonComponent!: ButtonComponent;

        protected initialiseButton (rootElement: HTMLElement): void
        {
            this.buttonComponent = new ButtonComponent(rootElement);
        }

        public setButtonLabel (label: string): void
        {
            this.buttonComponent.setLabel(label);
        }

        public setButtonEnabled (enabled: boolean): void
        {
            this.buttonComponent.setEnabled(enabled);
        }

        public setButtonState (active: boolean): void
        {
            this.buttonComponent.setState(active);
        }
    };
}
