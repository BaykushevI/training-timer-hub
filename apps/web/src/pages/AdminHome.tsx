import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import type { LoggedInUser } from "./LoginPage";

type TelemetryEvent = {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const API_BASE_URL = "http://localhost:8787";

type AdminHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    async function loadTelemetry() {
      const response = await fetch(`${API_BASE_URL}/api/admin/telemetry`);
      const data = await response.json();
      setEvents(data.events ?? []);
    }

    loadTelemetry();
  }, []);

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      title="Admin Workspace"
      subtitle="Operational entry point for telemetry, alerts, thresholds, and administrative controls."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-2 text-sm text-slate-400">Telemetry Overview</p>
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="mt-1 text-sm text-slate-500">Captured events</p>
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

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Telemetry</h3>
            <span className="text-sm text-slate-400">Newest first</span>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">No telemetry events yet.</p>
            ) : (
              events.slice(0, 10).map((event, index) => (
                <div
                  key={`${event.type}-${event.timestamp}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-100">{event.type}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <pre className="mt-3 overflow-x-auto text-xs text-slate-400">
                    {JSON.stringify(event.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
