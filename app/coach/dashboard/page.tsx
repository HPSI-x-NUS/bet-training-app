export default function CoachDashboard() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Coach Dashboard
      </h1>

      <p className="mt-3 text-gray-500">
        Monitor your athletes' cognitive performance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">Athletes</h2>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">
            Sessions Completed
          </h2>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">
            Average Accuracy
          </h2>
          <p className="mt-2 text-2xl font-bold">—</p>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-bold">
        Athlete Progress
      </h2>

      <div className="mt-4 rounded-xl border p-6">
        <p className="text-gray-500">
          No athlete data available yet.
        </p>
      </div>
    </main>
  );
}
