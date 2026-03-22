import { login } from "@repo/auth";
import {
  getActiveSession,
  pauseSession,
  resumeSession,
  startFocusSession,
  startTrainingSession,
  stopSession,
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

const app = new Hono();

function evaluateSystemAlerts() {
  evaluateAlerts(getEvents());
}

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

    evaluateSystemAlerts();

    return c.json({ error: "Invalid credentials" }, 401);
  }

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
  });
});

app.get("/api/settings/:userId", (c) => {
  const userId = c.req.param("userId");
  const settings = getUserSettings(userId);

  return c.json({ settings });
});

app.put("/api/settings/:userId", async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();

  const settings = updateUserSettings({
    userId,
    training: body.training,
    focus: body.focus,
  });

  trackEvent({
    type: "settings.updated",
    timestamp: Date.now(),
    metadata: {
      userId,
      training: settings.training,
      focus: settings.focus,
    },
  });

  evaluateSystemAlerts();

  return c.json({ settings });
});

app.post("/api/session/start", async (c) => {
  const body = await c.req.json();
  const { userId, mode } = body as {
    userId?: string;
    mode?: "training" | "focus";
  };

  if (!userId || !mode) {
    return c.json({ error: "Missing required fields" }, 400);
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

    evaluateSystemAlerts();

    return c.json({ error: "Unable to start session" }, 500);
  }
});

app.post("/api/session/pause", async (c) => {
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

app.post("/api/session/resume", async (c) => {
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

app.get("/api/session/:userId", (c) => {
  const userId = c.req.param("userId");
  const session = getActiveSession(userId);

  if (!session) {
    return c.json({ session: null });
  }

  return c.json({ session });
});

app.get("/api/admin/alerts", (c) => {
  return c.json({
    alerts: getAlerts(),
  });
});

app.post("/api/admin/alerts/:alertId/ack", (c) => {
  const alertId = c.req.param("alertId");
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

app.get("/api/admin/rules", (c) => {
  return c.json({
    rules: getAlertRules(),
  });
});

app.put("/api/admin/rules/:code", async (c) => {
  const code = c.req.param("code") as
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

app.get("/api/history/:userId", (c) => {
  const userId = c.req.param("userId");
  const history = getHistoryForUser(userId);

  return c.json({ history });
});

app.get("/api/admin/telemetry", (c) => {
  return c.json({
    events: getEvents(),
  });
});

export default app;
