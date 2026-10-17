import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { demoIdentity, demoPersonas } from "@/lib/demo-personas";
import { leaveDemo, switchDemoPersona, useAccount, useProfile } from "@/lib/store";
import { requestProductTour } from "@/lib/product-tour";

export function DemoBar() {
  const profile = useProfile();
  const account = useAccount();
  if (!profile?.demo || account.id) return null;
  const persona = demoPersonas.find((item) => item.id === demoIdentity(profile)) ?? demoPersonas[0];
  return (
    <aside className="demo-bar" aria-label="Demo controls">
      <span className="demo-label">DEMO</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="demo-persona" aria-label="Choose demo persona">
            <span className="demo-avatar" aria-hidden>{persona.name[0]}</span>
            <span>{persona.name}<span className="demo-job"> · {persona.job}</span></span>
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="center" sideOffset={12} className="demo-persona-menu">
          {demoPersonas.map((item) => (
            <DropdownMenuItem key={item.id} onSelect={() => switchDemoPersona(item.id)} aria-current={item.id === persona.id ? "true" : undefined}>
              <span className="demo-avatar" aria-hidden>{item.name[0]}</span>
              {item.name} · {item.job}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button asChild variant="ghost" className="demo-tour"><Link to="/home" onClick={requestProductTour}>Tour</Link></Button>
      <Button asChild variant="payment" className="demo-start"><Link to="/auth" onClick={(event) => { event.preventDefault(); leaveDemo(); window.location.assign("/auth"); }}>Start my own <ArrowRight aria-hidden /></Link></Button>
    </aside>
  );
}