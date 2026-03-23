import type {
  Session,
  SessionMode,
  SessionStatus,
  SessionConfigSnapshot,
  TrainingConfig,
  FocusConfig,
} from "@repo/core";

export type { Session, SessionMode, SessionStatus, SessionConfigSnapshot };

const sessions = new Map<string, Session>();

function generateSessionId() {
  return crypto.randomUUID();
}

function isActiveStatus(status: SessionStatus): boolean {
  return status === "running" || status === "paused";
}

export function startTrainingSession(params: {
  userId: string;
  training: TrainingConfig;
}): Session {
  const existingSession = sessions.get(params.userId);

  if (existingSession && isActiveStatus(existingSession.status)) {
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
  focus: FocusConfig;
}): Session {
  const existingSession = sessions.get(params.userId);

  if (existingSession && isActiveStatus(existingSession.status)) {
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

  // Guard: only active sessions can be stopped.
  // Returning null for stopped/completed sessions prevents duplicate history
  // records when the client calls stop more than once (double-click, retry).
  if (!existingSession || !isActiveStatus(existingSession.status)) {
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

/**
 * Marks a running session as naturally completed (timer reached zero).
 * Only valid for running sessions — a paused session cannot auto-complete
 * because time is not advancing while paused.
 */
export function completeSession(userId: string): Session | null {
  const existingSession = sessions.get(userId);

  if (!existingSession || existingSession.status !== "running") {
    return null;
  }

  const completedSession: Session = {
    ...existingSession,
    status: "completed",
    pausedAt: null,
  };

  sessions.set(userId, completedSession);
  return completedSession;
}

/**
 * Returns the session only if it is still active (running or paused).
 * Stopped and completed sessions return null — they are terminal states.
 */
export function getActiveSession(userId: string): Session | null {
  const session = sessions.get(userId);

  if (!session || !isActiveStatus(session.status)) {
    return null;
  }

  return session;
}
