import type { Constructor } from '../../common/constructorConstraint';

enum ModifierClassNames
{
    Active = "modifier-active",
    Inactive = "modifier-inactive",
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buttonMixin<TBase extends Constructor> (base: TBase)
{
    return class extends base
    {
        private button!: HTMLButtonElement;

        protected initialiseButton (rootElement: HTMLElement): void
        {
            const buttonElement = rootElement.querySelector('button');

            if (buttonElement === null)
            {
                throw new Error("Button element not found in template.");
            }

            this.button = buttonElement;
        }

        public set onButtonClicked (handler: (() => void)|null)
        {
            if (handler === null)
            {
                this.button.onclick = null;
            }
            else
            {
                this.button.onclick = (): void =>
                {
                    this.buttonState = !this.buttonState;
                    handler();
                };
            }
        }

        public get buttonLabel (): string
        {
            return this.button.textContent;
        }

        public set buttonLabel (label: string)
        {
            this.button.textContent = label;
        }

        public get buttonEnabled (): boolean
        {
            return !this.button.disabled;
        }

        public set buttonEnabled (enabled: boolean)
        {
            this.button.disabled = !enabled;
        }

        public get buttonState (): boolean
        {
            return this.button.classList.contains(ModifierClassNames.Active);
        }

        public set buttonState (active: boolean)
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
    };
}
