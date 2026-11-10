"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { athleteNavigation } from "@/lib/athlete-navigation";
import { BrainCircuit } from "lucide-react";

export function AthleteNavbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-white p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <BrainCircuit size={26} />
          </div>
          <span className="text-xl font-bold text-slate-900">
            BET Training
          </span>
        </div>

        <nav className="flex flex-col gap-2">
          {athleteNavigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={21} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Athlete navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white px-2 py-3 md:hidden"
      >
        {athleteNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                active
                  ? "text-blue-600"
                  : "text-slate-500"
              }`}
            >
              <Icon size={23} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
