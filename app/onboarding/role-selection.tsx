
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "athlete" | "coach";

export default function RoleSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function selectRole(role: Role) {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/auth/login");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push(
      role === "athlete"
        ? "/athlete/dashboard"
        : "/coach/dashboard"
    );
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-3">
        Welcome to BET Training!
      </h1>

      <p className="text-gray-500 mb-8">
        How will you be using the platform?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          disabled={loading}
          onClick={() => selectRole("athlete")}
          className="border rounded-xl p-8 text-center hover:border-blue-500 hover:shadow-lg transition disabled:opacity-50"
        >
          <div className="text-5xl mb-4">🏃</div>
          <h2 className="text-xl font-bold mb-2">Athlete</h2>
          <p className="text-gray-500">
            Play cognitive games, earn XP and track your progress.
          </p>
        </button>

        <button
          disabled={loading}
          onClick={() => selectRole("coach")}
          className="border rounded-xl p-8 text-center hover:border-green-500 hover:shadow-lg transition disabled:opacity-50"
        >
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">Coach</h2>
          <p className="text-gray-500">
            Monitor your athletes and their cognitive performance.
          </p>
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-500 mt-6">
          {error}
        </p>
      )}
    </main>
  );
}
