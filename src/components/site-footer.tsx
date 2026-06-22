import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-20 py-10 text-sm text-muted-foreground">
      <div className="bb-container flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-foreground">BrahmBook</span>
          <span>— a community resource</span>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/experts" className="hover:underline">
            Browse Experts
          </Link>
          <Link href="/experts/register" className="hover:underline">
            Register
          </Link>
          <Link href="/ask" className="hover:underline">
            Ask
          </Link>
        </nav>
      </div>
    </footer>
  );
}
