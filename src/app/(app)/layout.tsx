import { DashboardNav } from "@/components/layout/DashboardNav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
