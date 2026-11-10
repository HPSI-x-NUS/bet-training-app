
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "athlete" | "coach";

export async function getCurrentUserRole() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    user,
    role: (profile?.role ?? null) as UserRole | null,
  };
}

export async function requireRole(
  requiredRole: UserRole
) {
  const { user, role } = await getCurrentUserRole();

  if (!role) {
    redirect("/onboarding");
  }

  if (role !== requiredRole) {
    redirect(
      role === "athlete"
        ? "/athlete/dashboard"
        : "/coach/dashboard"
    );
  }

  return user;
}
