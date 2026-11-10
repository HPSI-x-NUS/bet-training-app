import { getCurrentUserRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { role } = await getCurrentUserRole();

  if (role === "athlete") {
    redirect("/athlete/dashboard");
  }

  if (role === "coach") {
    redirect("/coach/dashboard");
  }

  redirect("/onboarding");
}
