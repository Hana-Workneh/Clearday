import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProfile, saveProfile } from "@/lib/store";

export function ThemeToggle() {
  const profile = useProfile();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("clearday-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, [profile?.theme]);
  const toggle = async (next: boolean) => {
    if (next === dark) return;
    if (profile) { try { await saveProfile({...profile, theme: next ? "dark" : "light"}); } catch { return; } }
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("clearday-theme", next ? "dark" : "light");
  };
  return (
    <div role="group" aria-label="Color theme" className="flex h-10 shrink-0 items-center gap-0.5 rounded-full border bg-secondary p-1">
      <Button variant="ghost" size="icon" onClick={() => toggle(false)} aria-label="Switch to light mode" title="Light mode" aria-pressed={!dark} className={`h-8 w-8 rounded-full ${!dark ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Sun /></Button>
      <Button variant="ghost" size="icon" onClick={() => toggle(true)} aria-label="Switch to dark mode" title="Dark mode" aria-pressed={dark} className={`h-8 w-8 rounded-full ${dark ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Moon /></Button>
    </div>
  );
}
