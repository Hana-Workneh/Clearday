import { z } from "zod";

export const currencies = ["USD", "RWF", "KES", "ETB"] as const;
export type Currency = typeof currencies[number];
export const cleanText = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
const text = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max));
const amount = z.number().finite().min(0).max(100000000);
const id = text(100).pipe(z.string().min(1));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const parsed = new Date(value); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }, "Choose a real date");
const timestamp = z.string().max(40).refine(value => Number.isFinite(Date.parse(value)), "Choose a real date");
const boost = z.object({amount, months: z.number().int().min(1).max(600)});
const loan = z.object({ id, name: text(120).pipe(z.string().min(1)), balance: amount, startBalance: amount, rate: z.number().finite().min(0).max(1000), payment: amount.pipe(z.number().positive()) });
export const profileSchema = z.object({
  savingsGoal: z.object({ name: text(100).pipe(z.string().min(1)), amount: amount.pipe(z.number().positive()) }).optional(),
  name: text(100).pipe(z.string().min(1)), income: amount.pipe(z.number().positive()), job: text(160), skills: text(160).optional(), currency: z.enum(currencies).default("USD"), theme: z.enum(["light", "dark"]).optional(),
  loans: z.array(loan).max(100), payments: z.array(z.object({ id, loanId: id, amount: amount.pipe(z.number().positive()), date })).max(10000).optional(),
  plan: z.object({ extra: amount.optional(), strategy: z.enum(["avalanche", "snowball", "order"]).optional(), boost: boost.optional() }).optional(),
  startedAt: timestamp.optional(), startDebtFree: timestamp.nullable().optional(), catchUp: boost.extend({from: timestamp}).optional(), quietSeen: z.record(date).optional(),
}).superRefine((profile, ctx) => {
  for (const values of [profile.loans, profile.payments ?? []]) {
    if (new Set(values.map(item => item.id)).size !== values.length) ctx.addIssue({code: z.ZodIssueCode.custom, message: "Use unique saved record IDs"});
  }
});
export const money = (amount: number, currency: Currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export function mergeLocalData(account: z.infer<typeof profileSchema> | null, local: z.infer<typeof profileSchema>) {
  if (!account) return local;
  if (account.currency !== local.currency && local.loans.length) throw new Error("Your browser and account use different currencies. Their amounts cannot be combined automatically.");
  return { ...account, loans: [...account.loans, ...local.loans.filter(l => !account.loans.some(a => a.id === l.id))], payments: [...(account.payments ?? []), ...(local.payments ?? []).filter(p => !account.payments?.some(a => a.id === p.id))] };
}