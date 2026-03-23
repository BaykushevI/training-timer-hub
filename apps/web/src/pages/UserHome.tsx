import { useEffect, useRef, useState } from "react";
import type { Session, UserSettings, HistoryRecord } from "@repo/core";
import { AppShell } from "../components/AppShell";
import { UserWorkspaceTabs } from "../components/UserWorkspaceTabs";
import type { LoggedInUser } from "./LoginPage";
import { UserSettingsPage } from "./UserSettingsPage";
import { UserTimerPage } from "./UserTimerPage";

type UserTab = "training" | "focus" | "settings";

const API_BASE_URL = "http://localhost:8787";

type UserHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function UserHome({ user, onLogout }: UserHomeProps) {
  const [activeTab, setActiveTab] = useState<UserTab>("training");
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Settings form state — single source of truth for the form fields
  const [trainingWorkSeconds, setTrainingWorkSeconds] = useState(60);
  const [trainingRestSeconds, setTrainingRestSeconds] = useState(10);
  const [trainingRounds, setTrainingRounds] = useState(6);
  const [focusSeconds, setFocusSeconds] = useState(1500);
  const [focusShortBreakSeconds, setFocusShortBreakSeconds] = useState(300);
  const [focusCycles, setFocusCycles] = useState(4);

  // Guard against triggering auto-complete multiple times for the same session
  const completionTriggeredRef = useRef(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };

  useEffect(() => {
    async function loadInitialData() {
      const [sessionRes, settingsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/session/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        fetch(`${API_BASE_URL}/api/settings/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        fetch(`${API_BASE_URL}/api/history/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      const sessionData = await sessionRes.json();
      const settingsData = await settingsRes.json();
      const historyData = await historyRes.json();

      setSession(sessionData.session);
      setHistory(historyData.history ?? []);

      if (settingsData.settings) {
        syncFormState(settingsData.settings as UserSettings);
      }
    }

    loadInitialData();
  }, [user.id]);

  // Sync the 6 form variables from a confirmed UserSettings object.
  // Called on initial load and after a successful save to keep form state
  // consistent with the server-confirmed values.
  function syncFormState(s: UserSettings) {
    setTrainingWorkSeconds(s.training.workSeconds);
    setTrainingRestSeconds(s.training.restSeconds);
    setTrainingRounds(s.training.rounds);
    setFocusSeconds(s.focus.focusSeconds);
    setFocusShortBreakSeconds(s.focus.shortBreakSeconds);
    setFocusCycles(s.focus.cycles);
  }

  // Depend only on id and status — not the entire session object.
  // This prevents the interval from being torn down and recreated on every
  // refreshSession() call while the session is still "running".
  const sessionId = session?.id;
  const sessionStatus = session?.status;

  useEffect(() => {
    if (!sessionId || sessionStatus !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sessionId, sessionStatus]);

  // Reset auto-complete guard when the session changes
  useEffect(() => {
    completionTriggeredRef.current = false;
  }, [sessionId]);

  async function refreshSession() {
    const res = await fetch(`${API_BASE_URL}/api/session/${user.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setSession(data.session);
  }

  async function refreshHistory() {
    const res = await fetch(`${API_BASE_URL}/api/history/${user.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setHistory(data.history ?? []);
  }

  async function startTraining() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id, mode: "training" }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to start session");
        return;
      }

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function startFocus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id, mode: "focus" }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to start session");
        return;
      }

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function pauseCurrentSession() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/pause`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to pause session");
        return;
      }

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function resumeCurrentSession() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/resume`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to resume session");
        return;
      }

      await refreshSession();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function stopCurrentSession() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/stop`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id }),
      });

      // Unlike other actions, stop always refreshes — even on non-ok response —
      // so the UI reflects current server state accurately.
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to stop session");
      }

      await refreshSession();
      await refreshHistory();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  /**
   * Called by UserTimerPage when the derived countdown reaches zero.
   * Uses /api/session/complete to record finalStatus "completed" instead of
   * "stopped", producing accurate session history and telemetry.
   */
  async function completeCurrentSession() {
    if (completionTriggeredRef.current || loading) return;
    completionTriggeredRef.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/complete`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        // Completion may fail if session was already stopped manually.
        // This is not an error worth surfacing — just sync state.
      }

      await refreshSession();
      await refreshHistory();
      setNow(Date.now());
    } catch {
      // Network error during auto-complete: silently re-sync
      await refreshSession();
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/${user.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          training: {
            workSeconds: trainingWorkSeconds,
            restSeconds: trainingRestSeconds,
            rounds: trainingRounds,
          },
          focus: {
            focusSeconds,
            shortBreakSeconds: focusShortBreakSeconds,
            cycles: focusCycles,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to save settings");
        return;
      }

      const data = await response.json();
      // Sync both the settings object and the individual form variables from
      // the server response. This ensures the form reflects server-confirmed
      // values (e.g. if the server clamps or normalizes any field).
      syncFormState(data.settings);
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      title="User Workspace"
      subtitle="Entry point for timer modes, active session controls, and session history."
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <UserWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "training" ? (
        <UserTimerPage
          tab="training"
          session={session}
          history={history}
          loading={loading}
          now={now}
          onStartTraining={startTraining}
          onStartFocus={startFocus}
          onPause={pauseCurrentSession}
          onResume={resumeCurrentSession}
          onStop={stopCurrentSession}
          onComplete={completeCurrentSession}
        />
      ) : null}

      {activeTab === "focus" ? (
        <UserTimerPage
          tab="focus"
          session={session}
          history={history}
          loading={loading}
          now={now}
          onStartTraining={startTraining}
          onStartFocus={startFocus}
          onPause={pauseCurrentSession}
          onResume={resumeCurrentSession}
          onStop={stopCurrentSession}
          onComplete={completeCurrentSession}
        />
      ) : null}

      {activeTab === "settings" ? (
        <UserSettingsPage
          trainingWorkSeconds={trainingWorkSeconds}
          trainingRestSeconds={trainingRestSeconds}
          trainingRounds={trainingRounds}
          focusSeconds={focusSeconds}
          focusShortBreakSeconds={focusShortBreakSeconds}
          focusCycles={focusCycles}
          isRunning={
            session?.status === "running" || session?.status === "paused"
          }
          savingSettings={savingSettings}
          onTrainingWorkSecondsChange={setTrainingWorkSeconds}
          onTrainingRestSecondsChange={setTrainingRestSeconds}
          onTrainingRoundsChange={setTrainingRounds}
          onFocusSecondsChange={setFocusSeconds}
          onFocusShortBreakSecondsChange={setFocusShortBreakSeconds}
          onFocusCyclesChange={setFocusCycles}
          onSave={saveSettings}
        />
      ) : null}
    </AppShell>
  );
}
