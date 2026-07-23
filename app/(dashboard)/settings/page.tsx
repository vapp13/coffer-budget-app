"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogOut, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme, resolveSystemTheme } from "@/lib/theme/theme-provider";
import {
  userProfileFormSchema,
  CURRENCY_OPTIONS,
  SUPPORTED_LOCALES,
  type UserProfileFormInput,
} from "@/lib/validation/user-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading, saveProfile } = useUserProfile();
  const { setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserProfileFormInput>({
    resolver: zodResolver(userProfileFormSchema),
  });

  // Populate the form once the profile has loaded (or been seeded).
  useEffect(() => {
    if (profile) {
      reset({
        location: profile.location,
        currency: profile.currency,
        locale: profile.locale,
        themePreference: profile.themePreference,
        budgetCycleStartDay: profile.budgetCycleStartDay,
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: UserProfileFormInput) {
    try {
      await saveProfile.mutateAsync(values);
      const resolved =
        values.themePreference === "system" ? resolveSystemTheme() : values.themePreference;
      setTheme(resolved);
      toast.success("Settings saved");
    } catch {
      toast.error("Couldn't save your settings — try again.");
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your profile and preferences for how Coffer looks and formats things.
        </p>
      </div>

      <Card className="flex items-center gap-4">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="h-12 w-12 rounded-full border border-border"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium">
            {(user?.displayName ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{user?.displayName ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </Card>

      {isLoading && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </Card>
          <Card className="flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </Card>
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">Financial preferences</h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. United Kingdom" {...register("location")} />
              <FieldError message={errors.location?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="currency">Preferred currency</Label>
              <Select id="currency" {...register("currency")}>
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.currency?.message} />
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">App preferences</h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="locale">Date &amp; number format</Label>
              <Select id="locale" {...register("locale")}>
                {SUPPORTED_LOCALES.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.locale?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="themePreference">Theme</Label>
              <Select id="themePreference" {...register("themePreference")}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">Match system</option>
              </Select>
              <FieldError message={errors.themePreference?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="budgetCycleStartDay">Budget cycle start day</Label>
              <Input
                id="budgetCycleStartDay"
                type="number"
                min={1}
                max={28}
                {...register("budgetCycleStartDay")}
              />
              <p className="text-xs text-muted-foreground">
                If you're paid mid-month rather than on the 1st, set this to
                that day — "this month" will follow your pay cycle instead of
                the calendar month once budgeting periods use it.
              </p>
              <FieldError message={errors.budgetCycleStartDay?.message} />
            </div>
          </Card>

          <Button type="submit" disabled={saveProfile.isPending || !isDirty}>
            {saveProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}

      {!isLoading && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Data</h2>
          <Link
            href="/data"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <UploadCloud className="h-4 w-4" />
            Import &amp; export data
          </Link>
        </Card>
      )}

      {!isLoading && (
        <Button variant="outline" onClick={() => signOut()} className="text-negative">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      )}
    </main>
  );
}
