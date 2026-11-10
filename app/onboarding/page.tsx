import { getCurrentUserRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import RoleSelection from "./role-selection";

export default async function OnboardingPage() {
  const { role } = await getCurrentUserRole();

  if (role === "athlete") {
    redirect("/athlete/dashboard");
  }

  if (role === "coach") {
    redirect("/coach/dashboard");
  }

  return <RoleSelection />;
}
