import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryProvider } from "@/lib/query/query-provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { OfflineBanner } from "@/components/pwa/offline-banner";

// Same variable the Actions workflow sets for project-page deployments —
// icon/manifest URLs need it too, since they're plain strings that don't
// go through Next's basePath-aware asset pipeline automatically.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const APP_NAME = "Coffer";
const APP_DESCRIPTION =
  "A clear, calm way to see where your money goes — recurring expenses, income, budgets, and insights, built for real multi-month financial clarity.";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Personal Finance & Budgeting`, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${basePath}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/favicon.ico`, sizes: "any" },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  manifest: `${basePath}/manifest.json`,
  openGraph: {
    title: `${APP_NAME} — Personal Finance & Budgeting`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} — Personal Finance & Budgeting`,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0D0F" },
    { media: "(prefers-color-scheme: light)", color: "#FBFBF9" },
  ],
};

// Applied before hydration so the correct theme shows on first paint —
// without this, the page would flash light mode for an instant even for
// users who chose (or default to) dark.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('coffer-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <Toaster />
          <ServiceWorkerRegistration />
          <OfflineBanner />
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
