import { login, createToken, validateToken } from "@repo/auth";
import {
  getActiveSession,
  pauseSession,
  resumeSession,
  startFocusSession,
  startTrainingSession,
  stopSession,
  completeSession,
} from "@repo/session";
import { getUserSettings, updateUserSettings } from "@repo/settings";
import { getEvents, trackEvent } from "@repo/telemetry";
import {
  acknowledgeAlert,
  evaluateAlerts,
  getAlertRules,
  getAlerts,
  updateAlertRule,
} from "@repo/alerts";
import { addHistoryRecord, getHistoryForUser } from "@repo/history";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Context, Next } from "hono";

const app = new Hono();

function evaluateSystemAlerts() {
  evaluateAlerts(getEvents());
}

// ── CORS ──────────────────────────────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Auth middleware ───────────────────────────────────────────────────────────

/**
 * requireAuth: any valid token (user or admin).
 * Applied to all session, settings, and history routes.
 */
async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const user = validateToken(token);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
}

/**
 * requireAdmin: token must belong to a user with role === "admin".
 * Applied to all /api/admin/* routes.
 */
async function requireAdmin(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const user = validateToken(token);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  return next();
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

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

    evaluateSystemAlerts();

    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = createToken(user);

  trackEvent({
    type: "auth.login.success",
    timestamp: Date.now(),
    metadata: { userId: user.id },
  });

  evaluateSystemAlerts();

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

app.get("/api/settings/:userId", requireAuth, (c) => {
  const userId = c.req.param("userId")!;
  const settings = getUserSettings(userId);

  return c.json({ settings });
});

app.put("/api/settings/:userId", requireAuth, async (c) => {
  const userId = c.req.param("userId")!;
  const body = await c.req.json();

  const result = updateUserSettings({
    userId,
    training: body.training,
    focus: body.focus,
  });

  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  trackEvent({
    type: "settings.updated",
    timestamp: Date.now(),
    metadata: {
      userId,
      training: result.settings.training,
      focus: result.settings.focus,
    },
  });

  evaluateSystemAlerts();

  return c.json({ settings: result.settings });
});

// ── Session ───────────────────────────────────────────────────────────────────

app.post("/api/session/start", requireAuth, async (c) => {
  const body = await c.req.json();
  const { userId, mode } = body as {
    userId?: string;
    mode?: string;
  };

  if (!userId || !mode) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Validate mode explicitly — unknown values must not silently start a session
  if (mode !== "training" && mode !== "focus") {
    return c.json({ error: "Invalid mode. Must be 'training' or 'focus'" }, 400);
  }

  const settings = getUserSettings(userId);

  try {
    const session =
      mode === "training"
        ? startTrainingSession({
            userId,
            training: settings.training,
          })
        : startFocusSession({
            userId,
            focus: settings.focus,
          });

    trackEvent({
      type: "session.started",
      timestamp: Date.now(),
      metadata: {
        userId,
        mode,
        sessionId: session.id,
        configSnapshot: session.configSnapshot,
      },
    });

    evaluateSystemAlerts();

    return c.json({ session });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACTIVE_SESSION_ALREADY_EXISTS"
    ) {
      return c.json(
        { error: "An active session already exists for this user" },
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

    evaluateSystemAlerts();

    return c.json({ error: "Unable to start session" }, 500);
  }
});

app.post("/api/session/pause", requireAuth, async (c) => {
  const body = await c.req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const session = pauseSession(userId);

  if (!session) {
    return c.json({ error: "No running session found" }, 404);
  }

  trackEvent({
    type: "session.paused",
    timestamp: Date.now(),
    metadata: {
      userId,
      mode: session.mode,
      sessionId: session.id,
    },
  });

  evaluateSystemAlerts();

  return c.json({ session });
});

app.post("/api/session/resume", requireAuth, async (c) => {
  const body = await c.req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const session = resumeSession(userId);

  if (!session) {
    return c.json({ error: "No paused session found" }, 404);
  }

  trackEvent({
    type: "session.resumed",
    timestamp: Date.now(),
    metadata: {
      userId,
      mode: session.mode,
      sessionId: session.id,
    },
  });

  evaluateSystemAlerts();

  return c.json({ session });
});

app.post("/api/session/stop", requireAuth, async (c) => {
  const body = await c.req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const session = stopSession(userId);

  // stopSession returns null if the session is already stopped/completed or
  // doesn't exist — ensures addHistoryRecord is never called twice.
  if (!session) {
    return c.json({ error: "No active session found" }, 404);
  }

  addHistoryRecord({
    userId,
    mode: session.mode,
    startedAt: session.startedAt,
    endedAt: Date.now(),
    finalStatus: "stopped",
    configSnapshot: session.configSnapshot,
  });

  trackEvent({
    type: "session.stopped",
    timestamp: Date.now(),
    metadata: {
      userId,
      mode: session.mode,
      sessionId: session.id,
    },
  });

  evaluateSystemAlerts();

  return c.json({ session });
});

/**
 * /api/session/complete — called by the client when the timer reaches zero naturally.
 * Distinct from /stop: creates a history record with finalStatus "completed"
 * and emits a "session.completed" telemetry event instead of "session.stopped".
 */
app.post("/api/session/complete", requireAuth, async (c) => {
  const body = await c.req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const session = completeSession(userId);

  if (!session) {
    return c.json({ error: "No running session found" }, 404);
  }

  addHistoryRecord({
    userId,
    mode: session.mode,
    startedAt: session.startedAt,
    endedAt: Date.now(),
    finalStatus: "completed",
    configSnapshot: session.configSnapshot,
  });

  trackEvent({
    type: "session.completed",
    timestamp: Date.now(),
    metadata: {
      userId,
      mode: session.mode,
      sessionId: session.id,
    },
  });

  evaluateSystemAlerts();

  return c.json({ session });
});

app.get("/api/session/:userId", requireAuth, (c) => {
  const userId = c.req.param("userId")!;
  const session = getActiveSession(userId);

  return c.json({ session: session ?? null });
});

// ── History ───────────────────────────────────────────────────────────────────

app.get("/api/history/:userId", requireAuth, (c) => {
  const userId = c.req.param("userId")!;
  const history = getHistoryForUser(userId);

  return c.json({ history });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

app.get("/api/admin/telemetry", requireAdmin, (c) => {
  return c.json({
    events: getEvents(),
  });
});

app.get("/api/admin/alerts", requireAdmin, (c) => {
  return c.json({
    alerts: getAlerts(),
  });
});

app.post("/api/admin/alerts/:alertId/ack", requireAdmin, (c) => {
  const alertId = c.req.param("alertId")!;
  const alert = acknowledgeAlert(alertId);

  if (!alert) {
    return c.json({ error: "Alert not found" }, 404);
  }

  trackEvent({
    type: "admin.alert.acknowledged",
    timestamp: Date.now(),
    metadata: {
      alertId,
      ruleCode: alert.ruleCode,
    },
  });

  evaluateSystemAlerts();

  return c.json({ alert });
});

app.get("/api/admin/rules", requireAdmin, (c) => {
  return c.json({
    rules: getAlertRules(),
  });
});

app.put("/api/admin/rules/:code", requireAdmin, async (c) => {
  const code = c.req.param("code")! as
    | "failed_logins_spike"
    | "api_errors_spike"
    | "unusual_admin_activity"
    | "burst_session_activity";

  const body = await c.req.json();

  const rule = updateAlertRule({
    code,
    enabled: body.enabled,
    threshold: body.threshold,
  });

  if (!rule) {
    return c.json({ error: "Rule not found" }, 404);
  }

  trackEvent({
    type: "admin.rule.updated",
    timestamp: Date.now(),
    metadata: {
      code: rule.code,
      enabled: rule.enabled,
      threshold: rule.threshold,
    },
  });

  evaluateSystemAlerts();

  return c.json({ rule });
});

export default app;
