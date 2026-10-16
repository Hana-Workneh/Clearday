import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Menu, X } from "lucide-react";
import { CleardayLogo } from "./CleardayLogo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { startDemo, useAccount } from "@/lib/store";

const links = [
  { id: "how-it-works", label: "How it works" },
  { id: "why-clearday", label: "Why Clearday" },
  { id: "the-numbers", label: "The numbers" },
];

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

export function WelcomeNav() {
  const navigate = useNavigate();
  const account = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setShowTop(y > 700);
      let current = "";
      for (const link of links) {
        const el = document.getElementById(link.id);
        if (el && el.getBoundingClientRect().top <= 140) current = link.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled ? "border-b bg-background/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-5">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            }}
            aria-label="Back to top"
          >
            <CleardayLogo />
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active === link.id ? "bg-chip-green text-chip-green-text" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to={account.id ? "/home" : "/auth"}>{account.id ? "My account" : "Sign in"}</Link>
            </Button>
            <Button
              onClick={() => {
                startDemo();
                navigate({ to: "/home" });
              }}
              className="hidden h-10 rounded-full px-4 font-heading text-sm font-semibold sm:inline-flex"
            >
              Try the demo
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav className="border-t bg-background/95 px-5 py-3 backdrop-blur-md md:hidden" aria-label="Page sections">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                  active === link.id ? "bg-chip-green text-chip-green-text" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2 border-t pt-3">
              <Button asChild variant="outline" className="h-11 flex-1 rounded-full">
                <Link to={account.id ? "/home" : "/auth"}>{account.id ? "My account" : "Sign in"}</Link>
              </Button>
              <Button
                onClick={() => {
                  startDemo();
                  navigate({ to: "/home" });
                }}
                className="h-11 flex-1 rounded-full font-heading font-semibold"
              >
                Try the demo
              </Button>
            </div>
          </nav>
        )}
      </header>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-5 z-40 grid size-11 place-items-center rounded-full border bg-card text-foreground shadow-lg transition-opacity hover:bg-secondary"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </>
  );
}
