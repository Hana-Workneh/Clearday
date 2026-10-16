import { Sprout } from "@/components/Sprout";

const messages = ["Hi! Let's start with you.", "Now your loans. Rough numbers are fine.", "Here it comes..."];

export function SetupCompanion({ step, name, income, loans, date, ready, message }: {
  message?: string;
  step: number;
  name: string;
  income: string;
  loans: { id: string; name: string; amount: string }[];
  date: string | null;
  ready: boolean;
}) {
  const mood = step === 2 ? (ready ? "cheering" : "thinking") : "waving";
  return <>
    <aside className="hidden bg-setup-panel px-8 py-14 lg:flex lg:flex-col lg:justify-center xl:px-14" aria-label="Your live preview">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Sprout mood={mood} size={112} />
          <p className="leaf flex-1 bg-card px-5 py-4 text-sm font-semibold leading-relaxed">{message ?? messages[step]}</p>
        </div>
        <div className="leaf-lg setup-preview border bg-card p-7" aria-live="polite">
          <p className="text-xs font-semibold text-muted-foreground">clearday</p>
          <h2 className="mt-4 break-words text-2xl font-semibold">{name.trim() ? `${name.trim()}'s fresh start` : "Your fresh start"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{income || "Monthly take-home pay"}</p>
          <div className="mt-6 border-t">
            {loans.length > 0 ? loans.map(loan => <div key={loan.id} className="flex items-start justify-between gap-4 border-b py-4 text-sm"><span className="min-w-0 break-words font-semibold">{loan.name || "Loan name"}</span><span className="shrink-0 text-muted-foreground">{loan.amount}</span></div>) : <div className="space-y-3 py-5" aria-hidden="true"><div className="h-2 w-3/4 rounded-full bg-track" /><div className="h-2 w-1/2 rounded-full bg-track" /></div>}
          </div>
          <div className="pt-6">
            <p className="text-sm text-muted-foreground">Debt free by</p>
            {step === 2 && ready && date ? <p className="mt-2 break-words font-heading text-3xl font-semibold">{date}</p> : <div className="mt-3 h-5 w-2/3 rounded-full bg-track" aria-hidden="true" />}
            <div className="mt-5 grid grid-cols-10 gap-1.5" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-2 rounded-full ${step === 2 && ready && i === 0 ? "bg-green" : "bg-track"}`} />)}</div>
          </div>
        </div>
      </div>
    </aside>
    <div className="mb-7 flex items-center gap-3 lg:hidden">
      <Sprout mood={mood} size={64} />
      <p className="leaf max-w-72 bg-setup-panel px-4 py-3 text-sm font-semibold">{message ?? messages[step]}</p>
    </div>
  </>;
}