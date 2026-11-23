"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ProgressError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "Unable to load athlete progress:",
      error
    );
  }, [error]);

  return (
    <section className="mx-auto max-w-5xl p-6 md:p-10">
      <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600" />

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Unable to load your progress
        </h1>

        <p className="mx-auto mt-2 max-w-md text-slate-500">
          Your saved training data is still secure. Please
          try loading this page again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}