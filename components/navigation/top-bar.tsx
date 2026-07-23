"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-provider";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="font-display text-lg font-semibold">
          Coffer
        </Link>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Open account menu"
            aria-expanded={isMenuOpen}
            className="block rounded-full"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="h-8 w-8 rounded-full border border-border"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium">
                {(user?.displayName ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {isMenuOpen && (
            <>
              {/* Click-outside catcher */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-surface p-1 shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">
                    {user?.displayName ?? "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Profile &amp; settings
                </Link>

                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                </button>

                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-negative hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
