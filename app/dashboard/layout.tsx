import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardBackButton } from "@/components/dashboard/dashboard-back-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">{children}</main>
      <DashboardBackButton />
    </div>
  );
}
