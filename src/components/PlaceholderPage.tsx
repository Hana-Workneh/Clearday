import { Sprout, type SproutMood } from "./Sprout";

export function PlaceholderPage({ title, text, mood }: { title: string; text: string; mood: SproutMood }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="leaf flex items-center gap-5 border bg-card p-6">
          <Sprout mood={mood} size={90} />
          <p className="text-muted-foreground">{text}</p>
        </div>
        <div className="leaf border bg-card p-6">
          <span className="leaf inline-block bg-tip/10 px-3 py-1 text-xs font-semibold text-tip">Coming soon</span>
          <p className="mt-3 text-muted-foreground">We're growing this page. Check back soon!</p>
        </div>
      </div>
    </div>
  );
}
