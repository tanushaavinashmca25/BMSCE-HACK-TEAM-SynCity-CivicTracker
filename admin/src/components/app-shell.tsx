import Link from "next/link";
import { Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";
import { CopyrightFooter } from "./copyright-footer";
import { LogoutButton } from "./logout-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 group-hover:scale-[1.03]">
              <Shield className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-heading text-sm font-semibold tracking-tight">
                SynCity
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                Municipal operations
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <NavLinks />
            <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
            <ThemeToggle />
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex-1">{children}</div>
        <CopyrightFooter />
      </main>
    </div>
  );
}
