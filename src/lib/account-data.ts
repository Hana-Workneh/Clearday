import { z } from "zod";

export const currencies = ["USD", "RWF", "KES", "ETB"] as const;
export type Currency = typeof currencies[number];
const loan = z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(120), balance: z.number().finite().min(0), startBalance: z.number().finite().min(0), rate: z.number().finite().min(0), payment: z.number().finite().positive() });
export const profileSchema = z.object({
  savingsGoal: z.object({ name: z.string().trim().min(1).max(100), amount: z.number().finite().positive() }).optional(),
  name: z.string().trim().min(1).max(100), income: z.number().finite().positive(), job: z.string().max(160), currency: z.enum(currencies).default("USD"), theme: z.enum(["light", "dark"]).optional(),
  loans: z.array(loan).max(100), payments: z.array(z.object({ id: z.string(), loanId: z.string(), amount: z.number().finite().positive(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).max(10000).optional(),
  plan: z.object({ extra: z.number().finite().min(0).optional(), strategy: z.enum(["avalanche", "snowball", "order"]).optional(), boost: z.object({amount: z.number().min(0), months: z.number().int().positive()}).optional() }).optional(),
  startedAt: z.string().optional(), startDebtFree: z.string().nullable().optional(), catchUp: z.object({ amount: z.number().min(0), months: z.number().int().positive(), from: z.string() }).optional(), quietSeen: z.record(z.string()).optional(),
});
export const money = (amount: number, currency: Currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export function mergeLocalData(account: z.infer<typeof profileSchema> | null, local: z.infer<typeof profileSchema>) {
  if (!account) return local;
  if (account.currency !== local.currency && local.loans.length) throw new Error("Your browser and account use different currencies. Their amounts cannot be combined automatically.");
  return { ...account, loans: [...account.loans, ...local.loans.filter(l => !account.loans.some(a => a.id === l.id))], payments: [...(account.payments ?? []), ...(local.payments ?? []).filter(p => !account.payments?.some(a => a.id === p.id))] };
}