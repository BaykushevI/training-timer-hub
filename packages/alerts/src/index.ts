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

const defaultRules: AlertRule[] = [
  {
    code: "failed_logins_spike",
    label: "Failed login spike",
    enabled: true,
    threshold: 3,
  },
  {
    code: "api_errors_spike",
    label: "API errors spike",
    enabled: true,
    threshold: 3,
  },
  {
    code: "unusual_admin_activity",
    label: "Unusual admin activity",
    enabled: true,
    threshold: 5,
  },
  {
    code: "burst_session_activity",
    label: "Burst session activity",
    enabled: true,
    threshold: 5,
  },
];

let rulesStore: AlertRule[] = [...defaultRules];
const alertsStore: AlertRecord[] = [];

function generateAlertId() {
  return crypto.randomUUID();
}

export function getAlertRules(): AlertRule[] {
  return rulesStore;
}

export function updateAlertRule(params: {
  code: AlertRuleCode;
  enabled?: boolean;
  threshold?: number;
}): AlertRule | null {
  const existing = rulesStore.find((rule) => rule.code === params.code);

  if (!existing) {
    return null;
  }

  const updated: AlertRule = {
    ...existing,
    enabled: params.enabled ?? existing.enabled,
    threshold: params.threshold ?? existing.threshold,
  };

  rulesStore = rulesStore.map((rule) =>
    rule.code === params.code ? updated : rule,
  );

  return updated;
}

export function getAlerts(): AlertRecord[] {
  return alertsStore;
}

export function acknowledgeAlert(alertId: string): AlertRecord | null {
  const existing = alertsStore.find((alert) => alert.id === alertId);

  if (!existing) {
    return null;
  }

  if (existing.status === "acknowledged") {
    return existing;
  }

  existing.status = "acknowledged";
  existing.acknowledgedAt = Date.now();

  return existing;
}

function createAlert(params: {
  ruleCode: AlertRuleCode;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const alert: AlertRecord = {
    id: generateAlertId(),
    ruleCode: params.ruleCode,
    message: params.message,
    status: "open",
    createdAt: Date.now(),
    acknowledgedAt: null,
    metadata: params.metadata,
  };

  alertsStore.unshift(alert);
  return alert;
}

function countRecentEvents(
  events: Array<{
    type: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>,
  type: string,
  windowMs: number,
) {
  const now = Date.now();
  return events.filter(
    (event) => event.type === type && now - event.timestamp <= windowMs,
  ).length;
}

function countRecentAdminActivity(
  events: Array<{
    type: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>,
  windowMs: number,
) {
  const now = Date.now();
  return events.filter((event) => {
    const isRecent = now - event.timestamp <= windowMs;
    const isAdminEvent =
      event.type === "settings.updated" || event.type.startsWith("admin.");

    return isRecent && isAdminEvent;
  }).length;
}

function countRecentSessionStarts(
  events: Array<{
    type: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>,
  windowMs: number,
) {
  const now = Date.now();
  return events.filter(
    (event) =>
      event.type === "session.started" && now - event.timestamp <= windowMs,
  ).length;
}

function hasOpenAlertForRule(ruleCode: AlertRuleCode) {
  return alertsStore.some(
    (alert) => alert.ruleCode === ruleCode && alert.status === "open",
  );
}

export function evaluateAlerts(
  events: Array<{
    type: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>,
) {
  const windowMs = 5 * 60 * 1000;

  for (const rule of rulesStore) {
    if (!rule.enabled) {
      continue;
    }

    if (hasOpenAlertForRule(rule.code)) {
      continue;
    }

    if (rule.code === "failed_logins_spike") {
      const count = countRecentEvents(events, "auth.login.failed", windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `Failed login spike detected: ${count} failed logins in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "api_errors_spike") {
      const count = countRecentEvents(events, "api.error", windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `API error spike detected: ${count} API errors in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "unusual_admin_activity") {
      const count = countRecentAdminActivity(events, windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `Unusual admin activity detected: ${count} admin actions in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "burst_session_activity") {
      const count = countRecentSessionStarts(events, windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `Burst session activity detected: ${count} session starts in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }
  }
}
