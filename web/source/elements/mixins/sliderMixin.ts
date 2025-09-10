import type { Constructor } from '../../common/constructorConstraint';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function sliderMixin<TBase extends Constructor> (base: TBase)
{
    return class extends base
    {
        private slider!: HTMLInputElement;
        private maximum!: number;

        protected initialiseSlider (rootElement: HTMLElement): void
        {
            const sliderElement = rootElement.querySelector('input[type="range"]');

            if (sliderElement === null || !(sliderElement instanceof HTMLInputElement))
            {
                throw new Error("Slider element not found in template.");
            }

            this.slider = sliderElement;

            this.maximum = Number.parseFloat(sliderElement.max);
        }

        public set onSliderChanged (handler: (() => void)|null)
        {
            this.slider.oninput = handler;
        }

        public get sliderValue (): number
        {
            return Number.parseFloat(this.slider.value) / this.maximum;
        }

        public set sliderValue (value: number)
        {
            this.slider.value = (value * this.maximum).toString();
        }

        public get sliderEnabled (): boolean
        {
            return !this.slider.disabled;
        }

        public set sliderEnabled (enabled: boolean)
        {
            this.slider.disabled = !enabled;
        }
    };
}
