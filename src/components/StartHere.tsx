import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { openPayment } from "@/components/PaymentFlow";
import { useStartSteps } from "@/lib/start-here";

export function StartHere({ hasPayment }: { hasPayment: boolean }) {
  const steps = useStartSteps();
  if (!steps) return null;
  const items = [
    { label: "See how to pay faster", done: !!steps.payFaster, to: "/pay-faster" as const },
    { label: "Log your first payment", done: hasPayment, onClick: () => openPayment() },
    { label: "Get ideas in My plan", done: !!steps.ideas, to: "/plan" as const },
  ];
  if (items.every(i => i.done)) return null;
  const count = items.filter(i => i.done).length;
  return (
    <section className="leaf-lg border bg-card p-6" aria-label="Start here">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Start here</h2><span className="text-sm font-semibold text-muted-foreground">{count} of 3 done</span></div>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item, i) => {
          const inner = <>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${item.done ? "bg-sun text-ink" : "border-2 border-border text-xs font-bold text-muted-foreground"}`}>{item.done ? <Check className="size-4" /> : i + 1}</span>
            <span className={`text-sm font-semibold ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.label}</span>
          </>;
          const cls = "leaf flex w-full items-center gap-3 border p-4 text-left transition hover:border-foreground";
          return <li key={item.label}>{item.to ? <Link to={item.to} className={cls}>{inner}</Link> : <button type="button" onClick={item.onClick} className={cls}>{inner}</button>}</li>;
        })}
      </ol>
    </section>
  );
}
