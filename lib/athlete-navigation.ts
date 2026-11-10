import {
  House,
  Gamepad2,
  ChartNoAxesCombined,
  Trophy,
} from "lucide-react";

export const athleteNavigation = [
  {
    label: "Home",
    href: "/athlete/dashboard",
    icon: House,
  },
  {
    label: "Games",
    href: "/athlete/games",
    icon: Gamepad2,
  },
  {
    label: "Progress",
    href: "/athlete/progress",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Achievements",
    href: "/athlete/achievements",
    icon: Trophy,
  },
];
