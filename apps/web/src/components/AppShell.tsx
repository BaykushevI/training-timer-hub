import type { ReactNode } from "react";
import type { LoggedInUser } from "../pages/LoginPage";

type AppShellProps = {
  user: LoggedInUser;
  title: string;
  subtitle: string;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({
  user,
  title,
  subtitle,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Training Timer Hub
            </p>
            <h1 className="mt-1 text-lg font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 md:block">
              {user.email}
            </div>

            <div
              className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize ${
                user.role === "admin"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-sky-500/15 text-sky-300"
              }`}
            >
              {user.role}
            </div>

            <button
              onClick={onLogout}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{subtitle}</p>
        </section>

        <section>{children}</section>
      </div>
    </main>
  );
}
