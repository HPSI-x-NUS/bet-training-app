export default function ProgressLoading() {
  return (
    <section className="mx-auto max-w-5xl p-6 md:p-10">
      <div className="animate-pulse">
        <div className="h-4 w-44 rounded bg-slate-200" />

        <div className="mt-4 h-9 w-48 rounded bg-slate-200" />

        <div className="mt-3 h-5 w-80 max-w-full rounded bg-slate-200" />

        <div className="mt-10 space-y-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border bg-white p-5"
            >
              <div className="flex justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-6 w-32 rounded bg-slate-200" />
                  <div className="h-4 w-44 rounded bg-slate-200" />
                </div>

                <div className="h-16 w-24 rounded-xl bg-slate-200" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4">
                {[1, 2, 3, 4].map((metric) => (
                  <div key={metric}>
                    <div className="h-3 w-16 rounded bg-slate-200" />
                    <div className="mt-2 h-6 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}