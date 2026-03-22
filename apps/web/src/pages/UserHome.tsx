import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { UserWorkspaceTabs } from "../components/UserWorkspaceTabs";
import type { LoggedInUser } from "./LoginPage";
import { UserSettingsPage } from "./UserSettingsPage";
import { UserTimerPage } from "./UserTimerPage";

type TrainingSettings = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

type FocusSettings = {
  focusSeconds: number;
  shortBreakSeconds: number;
  cycles: number;
};

type UserSettings = {
  userId: string;
  training: TrainingSettings;
  focus: FocusSettings;
};

type Session =
  | {
      id: string;
      userId: string;
      mode: "training";
      startedAt: number;
      status: "running" | "paused" | "stopped";
      pausedAt: number | null;
      totalPausedMs: number;
      configSnapshot: {
        mode: "training";
        training: TrainingSettings;
      };
    }
  | {
      id: string;
      userId: string;
      mode: "focus";
      startedAt: number;
      status: "running" | "paused" | "stopped";
      pausedAt: number | null;
      totalPausedMs: number;
      configSnapshot: {
        mode: "focus";
        focus: FocusSettings;
      };
    };

type HistoryRecord = {
  id: string;
  userId: string;
  mode: "training" | "focus";
  startedAt: number;
  endedAt: number;
  finalStatus: "stopped";
  configSnapshot: Record<string, unknown>;
};

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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [trainingWorkSeconds, setTrainingWorkSeconds] = useState(60);
  const [trainingRestSeconds, setTrainingRestSeconds] = useState(10);
  const [trainingRounds, setTrainingRounds] = useState(6);
  const [focusSeconds, setFocusSeconds] = useState(1500);
  const [focusShortBreakSeconds, setFocusShortBreakSeconds] = useState(300);
  const [focusCycles, setFocusCycles] = useState(4);

  useEffect(() => {
    async function loadInitialData() {
      const [sessionRes, settingsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/session/${user.id}`),
        fetch(`${API_BASE_URL}/api/settings/${user.id}`),
        fetch(`${API_BASE_URL}/api/history/${user.id}`),
      ]);

      const sessionData = await sessionRes.json();
      const settingsData = await settingsRes.json();
      const historyData = await historyRes.json();

      setSession(sessionData.session);
      setSettings(settingsData.settings);
      setHistory(historyData.history ?? []);

      if (settingsData.settings) {
        setTrainingWorkSeconds(settingsData.settings.training.workSeconds);
        setTrainingRestSeconds(settingsData.settings.training.restSeconds);
        setTrainingRounds(settingsData.settings.training.rounds);
        setFocusSeconds(settingsData.settings.focus.focusSeconds);
        setFocusShortBreakSeconds(
          settingsData.settings.focus.shortBreakSeconds,
        );
        setFocusCycles(settingsData.settings.focus.cycles);
      }
    }

    loadInitialData();
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

  async function refreshHistory() {
    const res = await fetch(`${API_BASE_URL}/api/history/${user.id}`);
    const data = await res.json();
    setHistory(data.history ?? []);
  }

  async function startTraining() {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "training",
        }),
      });

      if (!response.ok) {
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "focus",
        }),
      });

      if (!response.ok) {
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
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

    try {
      await fetch(`${API_BASE_URL}/api/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      await refreshSession();
      await refreshHistory();
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

      const data = await response.json();
      setSettings(data.settings);
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
