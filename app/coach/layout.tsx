import { requireRole } from "@/lib/auth";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("coach");

  return <>{children}</>;
}
