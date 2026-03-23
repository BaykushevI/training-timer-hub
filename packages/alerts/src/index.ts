import type { AlertRuleCode, AlertRule, AlertRecord, TelemetryEvent } from "@repo/core";

export type { AlertRuleCode, AlertRule, AlertRecord };

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
  const index = alertsStore.findIndex((alert) => alert.id === alertId);

  if (index === -1) {
    return null;
  }

  const existing = alertsStore[index];

  if (existing.status === "acknowledged") {
    return existing;
  }

  // Immutable update — consistent with the rest of the codebase
  const acknowledged: AlertRecord = {
    ...existing,
    status: "acknowledged",
    acknowledgedAt: Date.now(),
  };

  alertsStore[index] = acknowledged;
  return acknowledged;
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
  events: TelemetryEvent[],
  type: string,
  windowMs: number,
): number {
  const cutoff = Date.now() - windowMs;
  return events.filter(
    (event) => event.type === type && event.timestamp >= cutoff,
  ).length;
}

/**
 * Counts actual admin actions only.
 * "settings.updated" is a user action and is intentionally excluded here.
 * Admin events are those with the "admin." prefix (e.g. admin.alert.acknowledged,
 * admin.rule.updated).
 */
function countRecentAdminActivity(
  events: TelemetryEvent[],
  windowMs: number,
): number {
  const cutoff = Date.now() - windowMs;
  return events.filter((event) => {
    return event.timestamp >= cutoff && event.type.startsWith("admin.");
  }).length;
}

function countRecentSessionStarts(
  events: TelemetryEvent[],
  windowMs: number,
): number {
  const cutoff = Date.now() - windowMs;
  return events.filter(
    (event) => event.type === "session.started" && event.timestamp >= cutoff,
  ).length;
}

function hasOpenAlertForRule(ruleCode: AlertRuleCode): boolean {
  return alertsStore.some(
    (alert) => alert.ruleCode === ruleCode && alert.status === "open",
  );
}

export function evaluateAlerts(events: TelemetryEvent[]): void {
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
          message: `Failed login spike: ${count} failed logins in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "api_errors_spike") {
      const count = countRecentEvents(events, "api.error", windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `API error spike: ${count} errors in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "unusual_admin_activity") {
      const count = countRecentAdminActivity(events, windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `Unusual admin activity: ${count} admin actions in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }

    if (rule.code === "burst_session_activity") {
      const count = countRecentSessionStarts(events, windowMs);

      if (count >= rule.threshold) {
        createAlert({
          ruleCode: rule.code,
          message: `Burst session activity: ${count} session starts in the last 5 minutes.`,
          metadata: { count, windowMinutes: 5 },
        });
      }
    }
  }
}
