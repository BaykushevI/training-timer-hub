import { AppShell } from "../components/AppShell";
import type { LoggedInUser } from "./LoginPage";

type AdminHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      title="Admin Workspace"
      subtitle="Operational entry point for telemetry, alerts, thresholds, and administrative controls."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Telemetry Overview</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Active Alerts</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Threshold Rules</p>
          <p className="text-lg font-semibold">Coming next</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-5 text-emerald-300">
        Admin role detected. This area will evolve into the operational
        dashboard for the L1 project.
      </div>
    </AppShell>
  );
}
