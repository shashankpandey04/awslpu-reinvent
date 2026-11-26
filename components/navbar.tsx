"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Compass,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Mic2,
  Ticket,
  X,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Experience", href: "/experience", icon: Compass },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Speakers", href: "/speakers", icon: Mic2 },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "About", href: "/about", icon: Info },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, authenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  const isLinkActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="absolute inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-10">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 rounded-full border border-white/[0.16] bg-white/[0.055] px-3 shadow-[0_12px_42px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.13)] ring-1 ring-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 sm:h-[4.5rem] sm:gap-5 sm:px-5 lg:px-7"
      >
        <Link
          href="/"
          aria-label="Re:Invent Fest 2026 home"
          onClick={() => setMenuOpen(false)}
          className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
        >
          <span className="flex min-w-0 flex-col leading-none">
            <span className="mb-1 hidden text-[8px] font-medium uppercase tracking-[0.2em] text-white/50 sm:block sm:text-[9px] sm:tracking-[0.24em]">
              AWS Student Builder Group
            </span>
            <span className="truncate text-[19px] font-light tracking-[-0.065em] text-white sm:text-[25px]">
              re<span className="text-[#e83cff]">:</span>Invent
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isLinkActive(link.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-[10px] font-medium transition-all duration-200 ${
                isLinkActive(link.href)
                  ? "bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/tickets"
            aria-label="Get tickets"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff2db2] to-[#8b5cff] px-3.5 text-[9px] font-semibold text-white shadow-[0_5px_20px_rgba(255,0,212,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_7px_24px_rgba(255,0,212,0.28)] sm:h-10 sm:px-4 sm:text-[10px]"
          >
            <Ticket className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Get tickets</span>
          </Link>

          {!loading && (
            authenticated ? (
              <>
                <Link
                  href="/dashboard"
                  aria-label="Open dashboard"
                  className="hidden h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 text-[10px] font-medium text-white transition-all hover:border-white/20 hover:bg-white/10 sm:inline-flex sm:h-10"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden 2xl:inline">Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-full px-3 py-2 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white sm:block"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth?mode=login"
                onClick={() => setMenuOpen(false)}
                className="hidden h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 text-[10px] font-medium text-white transition-all hover:border-white/20 hover:bg-white/10 sm:inline-flex sm:h-10"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
            )
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative z-[70] flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-all hover:border-[#e83cff]/50 hover:bg-white/10 xl:hidden sm:size-10"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <button
        type="button"
        aria-label="Close navigation menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 xl:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        className={`fixed inset-x-3 top-[4.75rem] z-[65] mx-auto flex max-h-[calc(100dvh-5.5rem)] max-w-lg flex-col overflow-y-auto rounded-[1.75rem] border border-white/[0.16] bg-white/[0.07] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/[0.05] backdrop-blur-3xl backdrop-saturate-150 transition-all duration-300 ease-out xl:hidden sm:top-[6rem] sm:p-5 ${
          menuOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c5a5ff]">
              AWS Student Builder Group
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
              {authenticated && user?.first_name
                ? `Hi, ${user.first_name}`
                : "Explore re:Invent"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/75 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {navLinks.filter((link) => link.href !== "/tickets").map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-14 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                  active
                    ? "border-[#ed5cda]/30 bg-[#ed5cda]/10 text-white"
                    : "border-white/[0.09] bg-white/[0.04] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/20 hover:bg-white/[0.075] hover:text-white"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? "bg-[#ed5cda]/15 text-[#ff9ee9]"
                      : "bg-white/[0.05] text-white/55"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                <span className="text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/tickets"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          className="mt-3 flex h-12 items-center justify-between rounded-full bg-gradient-to-r from-[#ff2db2] to-[#8b5cff] px-5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(255,0,212,0.18)] transition hover:brightness-110"
        >
          <span className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Get your tickets
          </span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>

        {!loading && (
          <div className="mt-4 border-t border-white/[0.08] pt-4">
            <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {authenticated ? "Your account" : "Already registered?"}
            </p>
            {authenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname.startsWith("/dashboard") ? "page" : undefined}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/[0.13] bg-white/[0.06] px-3 text-[10px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:bg-white/10"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={handleLogout}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-3 text-[10px] font-medium text-white/65 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/auth?mode=login"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/[0.13] bg-white/[0.06] text-[10px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in to your attendee account
              </Link>
            )}
          </div>
        )}
      </aside>
    </header>
  );
}
