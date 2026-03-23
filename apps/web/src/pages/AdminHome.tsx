import { useEffect, useState } from "react";
import type { TelemetryEvent, AlertRecord, AlertRule } from "@repo/core";
import { AppShell } from "../components/AppShell";
import type { LoggedInUser } from "./LoginPage";

const API_BASE_URL = "http://localhost:8787";

type AdminHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };

  async function loadAdminData() {
    const [telemetryRes, alertsRes, rulesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/admin/telemetry`, {
        headers: { Authorization: `Bearer ${user.token}` },
      }),
      fetch(`${API_BASE_URL}/api/admin/alerts`, {
        headers: { Authorization: `Bearer ${user.token}` },
      }),
      fetch(`${API_BASE_URL}/api/admin/rules`, {
        headers: { Authorization: `Bearer ${user.token}` },
      }),
    ]);

    const telemetryData = await telemetryRes.json();
    const alertsData = await alertsRes.json();
    const rulesData = await rulesRes.json();

    setEvents(telemetryData.events ?? []);
    setAlerts(alertsData.alerts ?? []);
    setRules(rulesData.rules ?? []);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleAcknowledge(alertId: string) {
    await fetch(`${API_BASE_URL}/api/admin/alerts/${alertId}/ack`, {
      method: "POST",
      headers: authHeaders,
    });

    await loadAdminData();
  }

  async function handleThresholdChange(ruleCode: string, threshold: number) {
    await fetch(`${API_BASE_URL}/api/admin/rules/${ruleCode}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ threshold }),
    });

    await loadAdminData();
  }

  async function handleToggleRule(ruleCode: string, enabled: boolean) {
    await fetch(`${API_BASE_URL}/api/admin/rules/${ruleCode}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ enabled }),
    });

    await loadAdminData();
  }

  const openAlerts = alerts.filter((alert) => alert.status === "open");

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
            <p className="mb-2 text-sm text-slate-400">Open Alerts</p>
            <p className="text-2xl font-bold">{openAlerts.length}</p>
            <p className="mt-1 text-sm text-slate-500">
              Current operational alerts
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-sm text-slate-400">Threshold Rules</p>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.code}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{rule.label}</p>
                      <p className="text-xs text-slate-500">{rule.code}</p>
                    </div>

                    <button
                      onClick={() => handleToggleRule(rule.code, !rule.enabled)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        rule.enabled
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm text-slate-400">Threshold</span>
                    <input
                      type="number"
                      min={1}
                      value={rule.threshold}
                      onChange={(e) =>
                        handleThresholdChange(rule.code, Number(e.target.value))
                      }
                      className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alerts</h3>
              <span className="text-sm text-slate-400">Newest first</span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-500">No alerts yet.</p>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-100">
                          {alert.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {alert.ruleCode} ·{" "}
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                            alert.status === "open"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {alert.status}
                        </span>

                        {alert.status === "open" ? (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                          >
                            Acknowledge
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Telemetry</h3>
              <span className="text-sm text-slate-400">Newest first</span>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No telemetry events yet.
                </p>
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
      </div>
    </AppShell>
  );
}
