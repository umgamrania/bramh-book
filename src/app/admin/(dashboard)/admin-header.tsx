"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, Globe } from "lucide-react";
import { toast } from "sonner";

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      toast.success("Successfully logged out");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
      <div className="bb-container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
              B
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">BrahmBook</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-saffron/10 px-2.5 py-0.5 text-xs font-medium text-saffron-foreground border border-saffron/20">
            <ShieldCheck className="h-3 w-3" /> Console
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Link href="/" target="_blank" className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              View Site
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-border hover:border-destructive/30 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
