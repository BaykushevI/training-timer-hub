export type SessionMode = "training" | "focus";
export type SessionStatus = "running" | "stopped";

export type Session = {
  id: string;
  userId: string;
  mode: SessionMode;
  startedAt: number;
  durationSeconds: number;
  status: SessionStatus;
};

const sessions = new Map<string, Session>();

function generateSessionId() {
  return crypto.randomUUID();
}

export function startSession(params: {
  userId: string;
  mode: SessionMode;
  durationSeconds: number;
}): Session {
  const existingSession = sessions.get(params.userId);

  if (existingSession && existingSession.status === "running") {
    throw new Error("ACTIVE_SESSION_ALREADY_EXISTS");
  }

  const session: Session = {
    id: generateSessionId(),
    userId: params.userId,
    mode: params.mode,
    startedAt: Date.now(),
    durationSeconds: params.durationSeconds,
    status: "running",
  };

  sessions.set(params.userId, session);

  return session;
}

export function stopSession(userId: string): Session | null {
  const existingSession = sessions.get(userId);

  if (!existingSession) {
    return null;
  }

  const stoppedSession: Session = {
    ...existingSession,
    status: "stopped",
  };

  sessions.set(userId, stoppedSession);

  return stoppedSession;
}

export function getActiveSession(userId: string): Session | null {
  const session = sessions.get(userId);

  if (!session) {
    return null;
  }

  if (session.status !== "running") {
    return null;
  }

  return session;
}
