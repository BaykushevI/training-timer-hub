export type SessionMode = "training" | "focus";
export type SessionStatus = "running" | "paused" | "stopped";

export type TrainingSessionConfig = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

export type FocusSessionConfig = {
  focusSeconds: number;
  shortBreakSeconds: number;
  cycles: number;
};

export type SessionConfigSnapshot =
  | {
      mode: "training";
      training: TrainingSessionConfig;
    }
  | {
      mode: "focus";
      focus: FocusSessionConfig;
    };

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

const sessions = new Map<string, Session>();

function generateSessionId() {
  return crypto.randomUUID();
}

export function startTrainingSession(params: {
  userId: string;
  training: TrainingSessionConfig;
}): Session {
  const existingSession = sessions.get(params.userId);

  if (
    existingSession &&
    (existingSession.status === "running" ||
      existingSession.status === "paused")
  ) {
    throw new Error("ACTIVE_SESSION_ALREADY_EXISTS");
  }

  const session: Session = {
    id: generateSessionId(),
    userId: params.userId,
    mode: "training",
    startedAt: Date.now(),
    status: "running",
    pausedAt: null,
    totalPausedMs: 0,
    configSnapshot: {
      mode: "training",
      training: params.training,
    },
  };

  sessions.set(params.userId, session);

  return session;
}

export function startFocusSession(params: {
  userId: string;
  focus: FocusSessionConfig;
}): Session {
  const existingSession = sessions.get(params.userId);

  if (
    existingSession &&
    (existingSession.status === "running" ||
      existingSession.status === "paused")
  ) {
    throw new Error("ACTIVE_SESSION_ALREADY_EXISTS");
  }

  const session: Session = {
    id: generateSessionId(),
    userId: params.userId,
    mode: "focus",
    startedAt: Date.now(),
    status: "running",
    pausedAt: null,
    totalPausedMs: 0,
    configSnapshot: {
      mode: "focus",
      focus: params.focus,
    },
  };

  sessions.set(params.userId, session);

  return session;
}

export function pauseSession(userId: string): Session | null {
  const existingSession = sessions.get(userId);

  if (!existingSession || existingSession.status !== "running") {
    return null;
  }

  const pausedSession: Session = {
    ...existingSession,
    status: "paused",
    pausedAt: Date.now(),
  };

  sessions.set(userId, pausedSession);

  return pausedSession;
}

export function resumeSession(userId: string): Session | null {
  const existingSession = sessions.get(userId);

  if (
    !existingSession ||
    existingSession.status !== "paused" ||
    !existingSession.pausedAt
  ) {
    return null;
  }

  const pausedDurationMs = Date.now() - existingSession.pausedAt;

  const resumedSession: Session = {
    ...existingSession,
    status: "running",
    pausedAt: null,
    totalPausedMs: existingSession.totalPausedMs + pausedDurationMs,
  };

  sessions.set(userId, resumedSession);

  return resumedSession;
}

export function stopSession(userId: string): Session | null {
  const existingSession = sessions.get(userId);

  if (!existingSession) {
    return null;
  }

  let totalPausedMs = existingSession.totalPausedMs;

  if (existingSession.status === "paused" && existingSession.pausedAt) {
    totalPausedMs += Date.now() - existingSession.pausedAt;
  }

  const stoppedSession: Session = {
    ...existingSession,
    status: "stopped",
    pausedAt: null,
    totalPausedMs,
  };

  sessions.set(userId, stoppedSession);

  return stoppedSession;
}

export function getSession(userId: string): Session | null {
  return sessions.get(userId) ?? null;
}

export function getActiveSession(userId: string): Session | null {
  const session = sessions.get(userId);

  if (!session) {
    return null;
  }

  if (session.status === "stopped") {
    return null;
  }

  return session;
}
