import { login } from "@repo/auth";
import {
  getActiveSession,
  startSession,
  stopSession,
  type SessionMode,
} from "@repo/session";
import { getEvents, trackEvent } from "@repo/telemetry";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/api/auth/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  const user = login(email, password);

  if (!user) {
    trackEvent({
      type: "auth.login.failed",
      timestamp: Date.now(),
      metadata: { email },
    });

    return c.json({ error: "Invalid credentials" }, 401);
  }

  trackEvent({
    type: "auth.login.success",
    timestamp: Date.now(),
    metadata: { userId: user.id },
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

app.post("/api/session/start", async (c) => {
  const body = await c.req.json();
  const { userId, mode, durationSeconds } = body as {
    userId?: string;
    mode?: SessionMode;
    durationSeconds?: number;
  };

  if (!userId || !mode || !durationSeconds) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const session = startSession({
      userId,
      mode,
      durationSeconds,
    });

    trackEvent({
      type: "session.started",
      timestamp: Date.now(),
      metadata: {
        userId,
        mode,
        durationSeconds,
        sessionId: session.id,
      },
    });

    return c.json({ session });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACTIVE_SESSION_ALREADY_EXISTS"
    ) {
      return c.json(
        { error: "Active session already exists for this user" },
        409,
      );
    }

    trackEvent({
      type: "api.error",
      timestamp: Date.now(),
      metadata: {
        route: "/api/session/start",
        reason: "unexpected_error",
      },
    });

    return c.json({ error: "Unable to start session" }, 500);
  }
});

app.post("/api/session/stop", async (c) => {
  const body = await c.req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const session = stopSession(userId);

  if (!session) {
    return c.json({ error: "No active session found" }, 404);
  }

  trackEvent({
    type: "session.stopped",
    timestamp: Date.now(),
    metadata: {
      userId,
      mode: session.mode,
      sessionId: session.id,
    },
  });

  return c.json({ session });
});

app.get("/api/session/:userId", (c) => {
  const userId = c.req.param("userId");
  const session = getActiveSession(userId);

  if (!session) {
    return c.json({ session: null });
  }

  return c.json({ session });
});

app.get("/api/admin/telemetry", (c) => {
  return c.json({
    events: getEvents(),
  });
});

export default app;
