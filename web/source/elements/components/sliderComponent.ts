import type { Constructor } from '../../common/constructorConstraint';

export class SliderComponent
{
    private readonly slider: HTMLInputElement;
    private readonly maximum: number;

    constructor (rootElement: HTMLElement)
    {
        const sliderElement = rootElement.querySelector('input[type="range"]');

        if (sliderElement === null || !(sliderElement instanceof HTMLInputElement))
        {
            throw new Error("Slider element not found in template.");
        }

        this.slider = sliderElement;

        this.maximum = Number.parseFloat(sliderElement.max);
    }

    public setValue (value: number): void
    {
        this.slider.value = (value * this.maximum).toString();
    }

    public setEnabled (enabled: boolean): void
    {
        this.slider.disabled = !enabled;
    }

    public setOnChangeHandler (handler: ((value: number) => void) | null): void
    {
        if (handler === null)
        {
            this.slider.oninput = null;
        }
        else
        {
            this.slider.oninput = (event: Event): void =>
            {
                const target = event.target as HTMLInputElement;
                const value = Number.parseFloat(target.value) / this.maximum;
                handler(value);
            };
        }
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function sliderMixing<TBase extends Constructor> (base: TBase)
{
    return class extends base
    {
        private sliderComponent!: SliderComponent;

        public set onChanged (handler: ((value: number) => void)|null)
        {
            this.sliderComponent.setOnChangeHandler(handler);
        }

        protected initialiseSlider (rootElement: HTMLElement): void
        {
            this.sliderComponent = new SliderComponent(rootElement);
        }

        public setSliderValue (value: number): void
        {
            this.sliderComponent.setValue(value);
        }

        public setSliderEnabled (enabled: boolean): void
        {
            this.sliderComponent.setEnabled(enabled);
        }
    };
}
