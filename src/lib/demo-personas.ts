import { addMonths, simulate } from "./debt";
import type { Profile } from "./store";
import type { Idea } from "./plan";

export const demoPersonas = [
  { id: "hana", name: "Hana", job: "Marketing officer", income: 500 },
  { id: "kofi", name: "Kofi", job: "Software developer", income: 2800 },
  { id: "maya", name: "Maya", job: "Product designer", income: 2400 },
  { id: "grace", name: "Grace", job: "Nurse", income: 1200 },
] as const;
export type DemoPersonaId = (typeof demoPersonas)[number]["id"];
export function demoIdentity(profile: Profile) {
  return profile.demoPersona ?? "hana";
}
export function createDemoPersona(id: DemoPersonaId, now = new Date()): Profile {
  const persona = demoPersonas.find((p) => p.id === id) ?? demoPersonas[0];
  const definitions: [string, number, number, number][] =
    id === "kofi"
      ? [
          ["Laptop loan", 2400, 12, 150],
          ["Education loan", 7500, 7, 240],
          ["Moving costs", 800, 0, 200],
        ]
      : id === "maya"
        ? [
            ["Design laptop", 2100, 10, 130],
            ["Education loan", 5800, 8, 200],
            ["Phone loan", 600, 0, 150],
          ]
        : id === "grace"
          ? [
              ["Training loan", 2800, 9, 110],
              ["Personal loan", 1600, 14, 80],
              ["Phone loan", 400, 0, 100],
            ]
          : [
              ["Phone loan", 300, 9, 40],
              ["Personal loan", 600, 15, 80],
              ["Salary advance", 200, 0, 50],
            ];
  const loans = definitions.map(([name, balance, rate, payment], i) => ({
    id: `${id}-loan-${i}`,
    name,
    balance,
    startBalance: balance,
    rate,
    payment,
  }));
  const started = addMonths(now, -4);
  const initial = simulate(loans, started);
  const payments: NonNullable<Profile["payments"]> = [];
  for (let month = 0; month < 4; month++) {
    const date = addMonths(now, month - 3);
    date.setDate(Math.min(8, now.getDate()));
    for (const loan of loans) {
      if (loan.balance <= 0) continue;
      const due = loan.balance * (1 + loan.rate / 1200);
      const amount = Math.min(loan.payment, due);
      loan.balance = Math.max(0, Math.round((due - amount) * 100) / 100);
      payments.push({
        id: `${id}-${month}-${loan.id}`,
        loanId: loan.id,
        amount: Math.round(amount * 100) / 100,
        date: date.toISOString().slice(0, 10),
      });
    }
  }
  return {
    name: persona.name,
    job: persona.job,
    income: persona.income,
    demo: true,
    demoPersona: id,
    currency: "USD",
    loans,
    payments,
    startedAt: started.toISOString(),
    startDebtFree: initial.debtFreeDate?.toISOString(),
    plan: { strategy: "avalanche", extra: 0 },
  };
}
export function demoIdeas(profile: Profile): Idea[] {
  const job = profile.job.toLowerCase();
  const rows: [string, string, number, "earn" | "save"][] = /software|developer|engineer/i.test(job)
    ? [
        [
          "A scoped bug-fix project",
          "Offer a small bug fix or API integration on Upwork. One modest project may leave this amount after costs and tax.",
          0.055,
          "earn",
        ],
        [
          "Paid code-review mentoring",
          "Review a junior developer’s personal sample code. Occasional paid sessions may leave this after costs and tax.",
          0.035,
          "earn",
        ],
        [
          "Sell a starter template",
          "Package your own app starter with clear documentation. Occasional sales could bring this net amount; never use employer code.",
          0.025,
          "earn",
        ],
        [
          "Write a technical tutorial",
          "Pitch an API or testing tutorial to a developer publication. Occasional accepted articles could average this net amount.",
          0.04,
          "earn",
        ],
        [
          "Trim unused dev subscriptions",
          "Review personal cloud sandboxes, coding tools and duplicate hosting. Cancel only unused services; savings depend on your bills.",
          0.012,
          "save",
        ],
      ]
    : /design|ux/i.test(job)
      ? [
          [
            "A small-business UX audit",
            "Review a shop’s checkout and deliver focused usability improvements. A scoped audit may net this amount.",
            0.06,
            "earn",
          ],
          [
            "Sell an original Figma kit",
            "Create an accessible component kit from your own work, respecting licensing. Occasional sales may net this amount.",
            0.03,
            "earn",
          ],
          [
            "Prototype a booking flow",
            "Offer a clearly scoped booking prototype to a local business. One modest project may leave this after costs and tax.",
            0.05,
            "earn",
          ],
          [
            "Portfolio mentoring",
            "Offer portfolio critiques to early-career designers. Occasional paid sessions may net this amount.",
            0.025,
            "earn",
          ],
          [
            "Trim design subscriptions",
            "Review unused stock, font and prototyping subscriptions. Cancel only what you do not need; savings depend on your bills.",
            0.012,
            "save",
          ],
        ]
      : /nurse/i.test(job)
        ? [
            [
              "Tutor nursing students",
              "Use your own revision material for anatomy or exam preparation. Occasional tutoring may net this amount.",
              0.05,
              "earn",
            ],
            [
              "Approved first-aid teaching",
              "Ask an accredited provider about paid sessions within your qualifications and local licensing rules. Occasional sessions may net this amount.",
              0.06,
              "earn",
            ],
            [
              "Create study flashcards",
              "Sell original nursing-study flashcards, never patient information or employer materials. Occasional sales may net this amount.",
              0.025,
              "earn",
            ],
            [
              "Plan shift-day meals",
              "Pack groceries you already buy for shifts instead of occasional bought lunches. Protect essentials; actual savings depend on your costs.",
              0.025,
              "save",
            ],
            [
              "Review unused subscriptions",
              "Check personal subscriptions rarely used around shifts. Only cancel what you do not need; savings depend on your bills.",
              0.01,
              "save",
            ],
          ]
        : [
            [
              "A local social-media project",
              "Offer a small content package to a local business. One modest project may net this amount.",
              0.06,
              "earn",
            ],
            [
              "An email campaign audit",
              "Review a small business’s signup and welcome email flow. A scoped audit may net this amount.",
              0.05,
              "earn",
            ],
            [
              "Sell a content-calendar template",
              "Build an original monthly content planner, never using employer material. Occasional sales may net this amount.",
              0.03,
              "earn",
            ],
            [
              "Pack workday lunches",
              "Use groceries you already buy instead of occasional bought lunches. This saving should never mean cutting essentials.",
              0.04,
              "save",
            ],
            [
              "Pause unused marketing tools",
              "Review unused personal scheduling or content subscriptions. Savings depend on your actual bills.",
              0.02,
              "save",
            ],
          ];
  return rows.map(([title, detail, fraction, kind], i) => ({
    title,
    detail:
      detail +
      (kind === "earn" ? " Check your contract before side work; keep employer data private." : ""),
    kind,
    monthlyAmount: Math.min(300, Math.max(5, Math.floor((profile.income * fraction) / 5) * 5)),
    ...(i < 3 || kind === "earn" ? { tag: `Because you're a ${job}` } : {}),
  }));
}
