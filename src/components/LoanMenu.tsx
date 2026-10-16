import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { loadProfile, saveProfile, today } from "@/lib/store";
import { removeLoan, markPaidOff } from "@/lib/loan-actions";
import type { Loan } from "@/lib/debt";

/** "..." menu with Edit, Mark as paid off and Delete for one loan. */
export function LoanMenu({ loan, onEdit, onDeleted, stayOnEmpty = false, disabled = false }: {
  loan: Loan;
  onEdit: () => void;
  onDeleted?: () => void;
  /** When true (setup), deleting the last loan doesn't navigate away. */
  stayOnEmpty?: boolean;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [party, setParty] = useState(false);

  const remove = async () => {
    const before = loadProfile();
    if (!before) return;
    setBusy(true);
    try {
      const next = removeLoan(before, loan.id);
      await saveProfile(next);
      setConfirm(false);
      onDeleted?.();
      toast(`${loan.name} deleted`, {
        duration: 5000,
        action: { label: "Undo", onClick: () => { void saveProfile(before).catch(() => toast("Couldn't bring it back. Please try again.")); } },
      });
      if (next.loans.length === 0 && !stayOnEmpty) navigate({ to: "/setup", search: { step: 1, empty: true } });
    } catch {
      toast("That loan couldn't be deleted. Please try again.");
    } finally { setBusy(false); }
  };

  const paidOff = async () => {
    const before = loadProfile();
    if (!before) return;
    const next = markPaidOff(before, loan.id, today(), crypto.randomUUID());
    try { await saveProfile(next); } catch { toast("Couldn't save that. Please try again."); return; }
    if (next.loans.length > 0 && next.loans.every((l) => l.balance <= 0)) { navigate({ to: "/debt-free", search: { preview: false } }); return; }
    setParty(true);
    setTimeout(() => setParty(false), 3000);
    toast(`${loan.name} paid off! Well done.`, { duration: 5000, action: { label: "Undo", onClick: () => { void saveProfile(before); } } });
  };

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} aria-label={`Options for ${loan.name}`} className="size-9 shrink-0"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="leaf min-w-44">
        <DropdownMenuItem onSelect={onEdit}><Pencil />Edit</DropdownMenuItem>
        {loan.balance > 0 && <DropdownMenuItem onSelect={() => { void paidOff(); }}><PartyPopper />Mark as paid off</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => setConfirm(true)}><Trash2 />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={confirm} onOpenChange={setConfirm}>
      <DialogContent className="leaf max-w-sm bg-card">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Delete {loan.name}?</DialogTitle>
          <DialogDescription>Its payments will be removed too.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" className="btn-secondary" onClick={() => setConfirm(false)}>Keep it</Button>
          <Button className="btn-main" disabled={busy} onClick={() => { void remove(); }}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
    {party && <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true"><Confetti /></div>}
  </>;
}
