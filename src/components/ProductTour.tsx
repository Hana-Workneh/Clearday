import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@tanstack/react-router";
import type { Driver } from "driver.js";
import { Sprout } from "./Sprout";
import { Button } from "./ui/button";
import { useAccount, useProfile } from "@/lib/store";
import { rememberTour, shouldShowTour, tourKey, tourSteps, TOUR_EVENT } from "@/lib/product-tour";

export function ProductTour() {
  const profile = useProfile(); const account = useAccount(); const location = useLocation();
  const instance = useRef<Driver | null>(null);
  const [replay, setReplay] = useState(0);
  const requested = useRef(false);
  const [bubble, setBubble] = useState<{ host: HTMLElement; index: number } | null>(null);
  const key = tourKey(!!profile?.demo, account.id);
  const eligible = !!profile && profile.loans.some(loan => loan.balance > 0) && (!!profile.demo || !!account.id);

  useEffect(() => {
    const replayTour = () => { requested.current = true; setReplay(value => value + 1); };
    window.addEventListener(TOUR_EVENT, replayTour);
    return () => window.removeEventListener(TOUR_EVENT, replayTour);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/home" || !eligible || !account.ready) return;
    let cancelled = false;
    let tour: Driver | null = null;
    let previousFocus: HTMLElement | null = null;
    const timer = window.setTimeout(async () => {
      try {
        if (!requested.current && !shouldShowTour(localStorage, key)) return;
      } catch { /* Tour can still run when browser storage is unavailable. */ }
      const { driver } = await import("driver.js");
      if (cancelled) return;
      const targets = tourSteps.map(step => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`)).find(element => element.getClientRects().length > 0));
      if (targets.some(target => !target)) return;
      requested.current = false;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      tour = driver({
        animate: !reduced, smoothScroll: false, overlayOpacity: .4,
        overlayColor: getComputedStyle(document.documentElement).getPropertyValue("--ink").trim(),
        stagePadding: 8, stageRadius: 20, popoverOffset: 14,
        disableActiveInteraction: true, overlayClickBehavior: "none", showButtons: [], showProgress: false,
        popoverClass: "sprout-tour", allowKeyboardControl: true,
        steps: tourSteps.map((_step, index) => ({ ...(targets[index] ? { element: targets[index] } : {}), popover: { description: " ", side: "bottom", align: "center" } })),
        onPopoverRender: (popover, options) => {
          popover.wrapper.setAttribute("aria-label", "Sprout's product tour");
          popover.wrapper.setAttribute("aria-modal", "true");
          popover.description.replaceChildren();
          const host = document.createElement("div");
          popover.description.appendChild(host);
          setBubble({ host, index: options.index ?? 0 });
        },
        onDestroyed: (_element, _step, options) => {
          if (!cancelled && options.reason !== "api") {
            try { rememberTour(localStorage, key, options.reason === "done" ? "finished" : "skipped"); } catch { /* Storage is optional. */ }
          }
          setBubble(null); instance.current = null;
          previousFocus?.focus({ preventScroll: true });
        },
      });
      instance.current = tour;
      tour.drive();
    }, 650);
    return () => { cancelled = true; clearTimeout(timer); tour?.destroy(); instance.current = null; setBubble(null); };
  }, [location.pathname, eligible, account.ready, key, replay]);

  useEffect(() => {
    if (!bubble) return;
    const frame = requestAnimationFrame(() => {
      instance.current?.refresh();
      bubble.host.querySelector<HTMLElement>("[data-tour-next]")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [bubble]);

  const close = (result: "finished" | "skipped") => {
    try { rememberTour(localStorage, key, result); } catch { /* Storage is optional. */ }
    instance.current?.destroy();
  };
  if (!bubble) return null;
  return createPortal(<div className="flex flex-col gap-3 text-foreground">
    <div className="flex items-center gap-3"><Sprout mood="waving" size={58} className="shrink-0" /><div><p className="font-heading text-base font-semibold">A little tour with Sprout</p><p className="text-xs text-muted-foreground" aria-live="polite">{bubble.index + 1} of 6</p></div></div>
    <p className="text-sm leading-relaxed">{tourSteps[bubble.index]?.text}</p>
    <div className="flex items-center justify-between gap-2">
      <Button variant="link" className="h-11 px-0 text-xs text-muted-foreground" onClick={() => close("skipped")}>Skip tour</Button>
      <div className="flex gap-2"><Button variant="outline" disabled={bubble.index === 0} className="h-11 rounded-full px-4" onClick={() => instance.current?.movePrevious()}>Back</Button><Button data-tour-next className="h-11 rounded-full px-5" onClick={() => bubble.index === 5 ? close("finished") : instance.current?.moveNext()}>{bubble.index === 5 ? "Done" : "Next"}</Button></div>
    </div>
  </div>, bubble.host);
}