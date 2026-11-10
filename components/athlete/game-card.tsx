
import Link from "next/link";
import {
  Brain,
  Target,
  Layers,
  Focus,
  Lock,
} from "lucide-react";

interface GameCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  available: boolean;
}

const gameIcons = {
  stroop: Brain,
  "n-back": Layers,
  flanker: Focus,
  "go-no-go": Target,
};

export function GameCard({
  id,
  name,
  description,
  category,
  durationMinutes,
  available,
}: GameCardProps) {
  const Icon =
    gameIcons[id as keyof typeof gameIcons] ?? Brain;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={28} />
        </div>

        {!available && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            <Lock size={12} />
            Coming Soon
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {name}
      </h3>

      <p className="mt-2 flex-1 text-sm text-slate-500">
        {description}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>{category}</span>
        <span>{durationMinutes} min</span>
      </div>

      {available ? (
        <Link
          href={`/athlete/games/${id}`}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
        >
          Play Game
        </Link>
      ) : (
        <span className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center font-semibold text-slate-400">
          Coming Soon
        </span>
      )}
    </div>
  );
}
