// ── Identity ─────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}

// ── Timer configuration ───────────────────────────────────────────────────────
// Canonical config shapes. These replace TrainingSettings/TrainingSessionConfig
// and FocusSettings/FocusSessionConfig — which were the same type under two names.

export type TrainingConfig = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

export type FocusConfig = {
  focusSeconds: number;
  shortBreakSeconds: number;
  cycles: number;
};

export type UserSettings = {
  userId: string;
  training: TrainingConfig;
  focus: FocusConfig;
};

// ── Session domain ────────────────────────────────────────────────────────────

export type SessionMode = "training" | "focus";

/**
 * running   → session is actively counting time
 * paused    → session is suspended; pausedAt and totalPausedMs track the gap
 * stopped   → user manually ended the session before natural completion
 * completed → timer ran to zero; session ended naturally
 */
export type SessionStatus = "running" | "paused" | "stopped" | "completed";

export type SessionConfigSnapshot =
  | { mode: "training"; training: TrainingConfig }
  | { mode: "focus"; focus: FocusConfig };

export type Session = {
  id: string;
  userId: string;
  mode: SessionMode;
  startedAt: number;
  status: SessionStatus;
  pausedAt: number | null;
  totalPausedMs: number;
  configSnapshot: SessionConfigSnapshot;
};

// ── History ───────────────────────────────────────────────────────────────────

/** stopped   → user pressed Stop before natural completion
 *  completed → timer ran to zero naturally */
export type HistoryFinalStatus = "stopped" | "completed";

export type HistoryRecord = {
  id: string;
  userId: string;
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  finalStatus: HistoryFinalStatus;
  configSnapshot: SessionConfigSnapshot; // typed union, not Record<string, unknown>
};

// ── Telemetry ─────────────────────────────────────────────────────────────────

export type TelemetryEvent = {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export type AlertRuleCode =
  | "failed_logins_spike"
  | "api_errors_spike"
  | "unusual_admin_activity"
  | "burst_session_activity";

export type AlertRule = {
  code: AlertRuleCode;
  label: string;
  enabled: boolean;
  threshold: number;
};

export type AlertRecord = {
  id: string;
  ruleCode: AlertRuleCode;
  message: string;
  status: "open" | "acknowledged";
  createdAt: number;
  acknowledgedAt: number | null;
  metadata?: Record<string, unknown>;
};
