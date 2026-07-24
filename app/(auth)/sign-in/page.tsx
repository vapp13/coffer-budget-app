"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/logo.svg`} alt="" width={56} height={56} className="rounded-xl" />
        <h1 className="font-display text-3xl font-semibold">Coffer</h1>
        <p className="text-sm text-muted-foreground">
          A clear, calm way to see where your money goes.
        </p>
      </div>
      <GoogleSignInButton />
    </main>
  );
}
