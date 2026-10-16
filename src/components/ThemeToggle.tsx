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
  const toggle = async () => {
    const next = !dark;
    if (profile) { try { await saveProfile({...profile, theme: next ? "dark" : "light"}); } catch { return; } }
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("clearday-theme", next ? "dark" : "light");
  };
  return (
    <Button variant="outline" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="leaf grid h-10 w-10 place-items-center border bg-card text-foreground transition hover:bg-secondary">
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
