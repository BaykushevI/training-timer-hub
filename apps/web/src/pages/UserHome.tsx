import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import type { LoggedInUser } from "./LoginPage";

type Session = {
  id: string;
  userId: string;
  mode: "training" | "focus";
  startedAt: number;
  durationSeconds: number;
  status: "running" | "stopped";
};

const API_BASE_URL = "http://localhost:8787";

type UserHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRemainingSeconds(session: Session | null, now: number) {
  if (!session || session.status !== "running") {
    return 0;
  }

  const elapsedSeconds = Math.floor((now - session.startedAt) / 1000);
  return Math.max(0, session.durationSeconds - elapsedSeconds);
}

export function UserHome({ user, onLogout }: UserHomeProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE_URL}/api/session/${user.id}`);
      const data = await res.json();
      setSession(data.session);
    }

    load();
  }, [user.id]);

  useEffect(() => {
    if (!session || session.status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session]);

  async function refreshSession() {
    const res = await fetch(`${API_BASE_URL}/api/session/${user.id}`);
    const data = await res.json();
    setSession(data.session);
  }

  async function startTraining() {
    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "training",
          durationSeconds: 900,
        }),
      });

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function stopCurrentSession() {
    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  const remainingSeconds = getRemainingSeconds(session, now);
  const isRunning = session?.status === "running";

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      title="User Workspace"
      subtitle="Entry point for timer modes, active session controls, and session history."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-2 text-sm text-slate-400">Active Session</p>

          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Mode</span>
              <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm capitalize text-slate-200">
                {session?.mode ?? "none"}
              </span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <span
                className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  isRunning
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {session?.status ?? "idle"}
              </span>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-400">Remaining Time</p>
              <div className="text-5xl font-bold tracking-tight text-emerald-300">
                {isRunning ? formatSeconds(remainingSeconds) : "00:00"}
              </div>
            </div>

            {session ? (
              <p className="mt-4 text-sm text-slate-400">
                Started at {new Date(session.startedAt).toLocaleTimeString()}
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No active session</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startTraining}
              disabled={loading || isRunning}
              className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Training
            </button>

            <button
              onClick={stopCurrentSession}
              disabled={loading || !isRunning}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Stop Session
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-2 text-sm text-slate-400">Training Timer</p>
            <p className="text-lg font-semibold">15 min default</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-2 text-sm text-slate-400">Focus Timer</p>
            <p className="text-lg font-semibold">Coming next</p>
          </div>

          <div className="rounded-2xl border border-sky-900/40 bg-sky-950/30 p-5 text-sky-300">
            This workspace now has a live countdown derived from backend session
            data, without adding real-time infrastructure.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
