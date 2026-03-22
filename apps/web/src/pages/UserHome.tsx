import { AppShell } from "../components/AppShell";
import type { LoggedInUser } from "./LoginPage";

type UserHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function UserHome({ user, onLogout }: UserHomeProps) {
  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      title="User Workspace"
      subtitle="Entry point for timer modes, active session controls, and session history."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Training Timer</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Focus Timer</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Session History</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-sky-900/40 bg-sky-950/30 p-5 text-sky-300">
        Standard user role detected. This area will evolve into the main timer
        workspace for the L1 project.
      </div>
    </AppShell>
  );
}
