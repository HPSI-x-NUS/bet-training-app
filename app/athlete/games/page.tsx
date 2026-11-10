
import { GameCard } from "@/components/athlete/game-card";
import { mockGames } from "@/lib/mock-data";

export default function GamesPage() {
  return (
    <section className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Cognitive Games
        </h1>

        <p className="mt-3 text-slate-500">
          Choose a game to train your cognitive skills.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {mockGames.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </section>
  );
}
