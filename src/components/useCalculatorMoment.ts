import { useEffect, useRef, useState } from "react";
import { BOUNCE_COUNT, BOUNCE_MS, HOVER_MARGIN, VIEW_THRESHOLD, canReplay, pointerTilt } from "@/lib/calculator-moment";

export function useCalculatorMoment() {
  const cardRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const [holding, setHolding] = useState(false);
  const [bounce, setBounce] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  useEffect(() => {
    const card = cardRef.current;
    const home = homeRef.current;
    const mover = moverRef.current;
    if (!card || !home || !mover) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let hovered = false;
    let playing = false;
    let last = -Infinity;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let seen = false;
    let away = false;
    let pointer: { x: number; y: number } | undefined;
    const position = () => {
      // The untransformed parent is stable during lifting and bouncing.
      const anchor = card.parentElement;
      const c = anchor?.getBoundingClientRect();
      const h = home.getBoundingClientRect();
      if (!c || !anchor) return;
      const prior = Number.parseFloat(anchor.style.getPropertyValue('--hover-clearance')) || 0;
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64;
      const clearance = Math.max(0, headerBottom + h.height * .93 + 12 - c.top);
      anchor.style.setProperty('--hover-clearance', `${clearance}px`);
      mover.style.setProperty("--hop-x", `${c.left + c.width * .24 - h.left - h.width / 2}px`);
      mover.style.setProperty("--hop-y", `${c.top - (h.top - prior) - h.height * .93 - 6}px`);
    };
    const settle = () => {
      setHolding(false);
      setBouncing(false);
      card.dataset['lifted'] = "false";
      card.parentElement?.style.setProperty('--hover-clearance', '0px');
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };
    const play = () => {
      if (reduced.matches) return;
      position();
      setHolding(true);
      card.dataset['lifted'] = "true";
      const now = performance.now();
      if (!canReplay(now, last)) {
        if (!hovered) settle();
        return;
      }
      last = now;
      playing = true;
      setBouncing(true);
      setBounce((n) => n + 1);
      clearTimeout(timer);
      timer = setTimeout(() => {
        playing = false;
        setBouncing(false);
        if (!hovered) settle();
      }, 450 + BOUNCE_COUNT * BOUNCE_MS);
    };
    const checkPointer = () => {
      if (!fine.matches || reduced.matches || !pointer) return;
      const rect = card.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const inside = pointer.x >= rect.left - HOVER_MARGIN && pointer.x <= rect.right + HOVER_MARGIN && pointer.y >= rect.top - HOVER_MARGIN && pointer.y <= rect.bottom + HOVER_MARGIN;
      if (inside !== hovered) {
        hovered = inside;
        if (inside) play();
        else { playing = false; clearTimeout(timer); settle(); }
      }
      if (inside) {
        card.style.setProperty("--tilt-y", `${pointerTilt((pointer.x - rect.left - rect.width / 2) / (rect.width / 2))}deg`);
        card.style.setProperty("--tilt-x", `${-pointerTilt((pointer.y - rect.top - rect.height / 2) / (rect.height / 2))}deg`);
      }
    };
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(checkPointer);
    };
    const scroll = () => { checkPointer(); if (hovered || playing) position(); };
    const leave = () => { pointer = undefined; hovered = false; playing = false; clearTimeout(timer); settle(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const visible = entry.intersectionRatio >= VIEW_THRESHOLD;
      if (!seen) { seen = true; away = !visible; return; }
      if (!visible) away = true;
      else if (away) { away = false; checkPointer(); play(); }
    }, { threshold: [0, VIEW_THRESHOLD, 1] });
    observer.observe(card);
    const resize = new ResizeObserver(position);
    resize.observe(home);
    resize.observe(card);
    const motionChange = () => { if (reduced.matches) leave(); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave);
    reduced.addEventListener("change", motionChange);
    return () => {
      clearTimeout(timer); cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("pointermove", move); window.removeEventListener("scroll", scroll);
      window.removeEventListener("blur", leave); document.documentElement.removeEventListener("pointerleave", leave);
      reduced.removeEventListener("change", motionChange);
    };
  }, []);
  return { cardRef, homeRef, moverRef, holding, bounce, bouncing };
}