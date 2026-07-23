import { ProtectedRoute } from "@/components/auth/protected-route";
import { ThemeProfileSync } from "@/components/theme/theme-profile-sync";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ThemeProfileSync />
      <TopBar />
      <div className="pb-24">{children}</div>
      <BottomNav />
    </ProtectedRoute>
  );
}
