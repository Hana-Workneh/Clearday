import * as SliderPrimitive from "@radix-ui/react-slider";
import { Hand } from "lucide-react";

export function HeroSlider({ hint = false, hand = false, ...props }: React.ComponentProps<typeof SliderPrimitive.Root> & { hint?: boolean; hand?: boolean }) {
  return (
    <SliderPrimitive.Root {...props} className={`hero-slider relative mt-3 flex w-full touch-none select-none items-center ${hint ? "hero-payment-pulse" : ""}`}>
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-track">
        <SliderPrimitive.Range className="absolute h-full bg-green" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="hero-slider-knob rounded-full border-[5px] border-green bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="hero-knob-tooltip" aria-hidden="true">Drag me ↔</span>
        {hand && <Hand className="hero-knob-hand" aria-hidden="true" />}
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}