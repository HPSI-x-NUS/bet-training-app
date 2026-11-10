import { requireRole } from "@/lib/auth";
import { AthleteNavbar } from "@/components/athlete/athlete-navbar";

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("athlete");

  return (
    <div className="min-h-screen bg-slate-50">
      <AthleteNavbar />

      <main className="min-h-screen pb-24 md:ml-64 md:pb-8">
        {children}
      </main>
    </div>
  );
}
