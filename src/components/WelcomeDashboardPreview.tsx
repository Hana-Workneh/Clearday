import { Sprout } from "./Sprout";
import { Sparkles } from "lucide-react";

export function WelcomeDashboardPreview() {
  return (
    <div className="welcome-dashboard relative mx-auto mt-12 w-full max-w-[640px] pb-16 text-left md:mt-14" aria-label="Dashboard preview">
      <div className="welcome-dashboard-card leaf-lg mr-6 border bg-card px-6 pb-14 pt-7 sm:px-8 md:mr-28 md:pb-10">
        <p className="text-sm font-semibold text-muted-foreground">Debt free by</p>
        <p className="mt-2 font-heading text-4xl font-bold leading-tight sm:text-5xl">June 2029</p>
        <div className="mt-7 grid grid-cols-10 gap-1.5" role="progressbar" aria-label="Debt paid" aria-valuenow={34} aria-valuemin={0} aria-valuemax={100}>
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className="relative h-3 overflow-hidden rounded-full bg-track">
              {index < 3 && <span className="absolute inset-0 rounded-full bg-green" />}
              {index === 3 && <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-green" />}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">34% of the way there</p>
      </div>
      <div className="pointer-events-none absolute -right-2 -top-6 md:right-0 md:top-8">
        <div className="md:hidden"><Sprout mood="waving" size={88} /></div>
        <div className="hidden md:block"><Sprout mood="waving" size={132} /></div>
      </div>
      <div className="welcome-dashboard-tip leaf absolute bottom-2 right-0 flex w-[230px] items-start gap-3 bg-tip-solid p-5 text-tip-foreground sm:w-[270px] md:right-8">
        <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold leading-relaxed">Pay $20 more and be free 11 months sooner</p>
      </div>
    </div>
  );
}