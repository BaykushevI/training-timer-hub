import { Hono } from "hono";
import { cors } from "hono/cors";
import { login } from "@repo/auth";
import { trackEvent } from "@repo/telemetry";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
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

export default app;
