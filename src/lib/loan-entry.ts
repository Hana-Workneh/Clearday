import type { Loan } from "./debt";
export type LoanDraft = {name: string; balance: string; rate: string; payment: string};
export const emptyLoan: LoanDraft = {name: "", balance: "", rate: "", payment: ""};
export const loanNumber = (text: string) => Number(text.replaceAll(",", "").trim());
export const draftIsEmpty = (draft: LoanDraft) => Object.values(draft).every(value => !value.trim());
export function loanErrors(draft: LoanDraft) {
  const errors: Partial<Record<keyof LoanDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Add a name for this loan";
  else if (draft.name.trim().length > 120) errors.name = "Keep the name under 120 characters";
  if (!draft.balance.trim()) errors.balance = "Add the amount left to pay";
  else if (!Number.isFinite(loanNumber(draft.balance)) || loanNumber(draft.balance) <= 0) errors.balance = "Use an amount greater than zero";
  if (!draft.rate.trim()) errors.rate = "Add the yearly rate — use 0 for no interest";
  else if (!Number.isFinite(loanNumber(draft.rate)) || loanNumber(draft.rate) < 0) errors.rate = "Use 0 or a positive yearly rate";
  if (!draft.payment.trim()) errors.payment = "Add the monthly payment";
  else if (!Number.isFinite(loanNumber(draft.payment)) || loanNumber(draft.payment) <= 0) errors.payment = "Use a payment greater than zero";
  return errors;
}
export const canContinueLoans = (draft: LoanDraft, loans: Loan[]) => !draftIsEmpty(draft) || loans.length > 0;
export function commitLoan(draft: LoanDraft, loans: Loan[], id: string) {
  if (Object.keys(loanErrors(draft)).length) return null;
  const existing = loans.find(l => l.id === id);
  const balance = loanNumber(draft.balance);
  const next = {id, name: draft.name.trim(), balance, startBalance: Math.max(existing?.startBalance ?? balance, balance), rate: loanNumber(draft.rate), payment: loanNumber(draft.payment)};
  return existing ? loans.map(l => l.id === id ? next : l) : [...loans, next];
}