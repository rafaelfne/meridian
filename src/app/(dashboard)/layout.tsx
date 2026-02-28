import { SessionProvider } from "@/components/shared/SessionProvider";
import { AppHeader } from "@/components/shared/AppHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
