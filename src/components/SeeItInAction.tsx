import home from "@/assets/see-home.jpg";
import celebrate from "@/assets/see-celebrate.jpg";
import pay from "@/assets/see-pay.jpg";

const shots = [
  { src: home, alt: "Clearday Home showing the debt free date and progress pills", caption: "Your debt free date, front and center." },
  { src: celebrate, alt: "Payment celebration with confetti and a cheering Sprout", caption: "Every payment gets a little celebration." },
  { src: pay, alt: "Pay faster page with the extra-payment slider", caption: "Slide a little extra and watch the date move." },
];

export function SeeItInAction() {
  return (
    <section id="see-it" className="mx-auto max-w-5xl scroll-mt-24 py-12 md:px-5 md:py-16" aria-labelledby="see-title">
      <div className="mb-8 px-5 text-center md:px-0">
        <p className="text-xs font-bold uppercase text-muted-foreground">The real app</p>
        <h2 id="see-title" className="mt-2 text-3xl font-semibold">See it in action</h2>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
        {shots.map((s) => (
          <figure key={s.caption} className="w-[82%] shrink-0 snap-center md:w-auto">
            <div className="leaf overflow-hidden border bg-card shadow-[var(--shadow-product)]">
              <div className="flex gap-1.5 border-b px-3 py-2" aria-hidden="true">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
              </div>
              <img src={s.src} alt={s.alt} loading="lazy" width={1200} height={800} className="block aspect-[3/2] w-full object-cover object-top" />
            </div>
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">{s.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
