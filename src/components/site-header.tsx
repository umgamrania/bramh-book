"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const base = "px-3 py-2 rounded-md transition-colors hover:bg-accent";
    const active = "bg-accent text-accent-foreground";
    return pathname === path ? `${base} ${active}` : base;
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="bb-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
            B
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">BrahmBook</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/experts" className={getLinkClass("/experts")}>
            Experts
          </Link>
          <Link href="/experts/register" className={getLinkClass("/experts/register")}>
            Become an Expert
          </Link>
          <Link
            href="/ask"
            className="ml-2 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ask a Question
          </Link>
        </nav>
        <Link
          href="/ask"
          className="md:hidden inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
        >
          Ask
        </Link>
      </div>
    </header>
  );
}
