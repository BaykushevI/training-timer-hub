import type { TelemetryEvent } from "@repo/core";

export type { TelemetryEvent };

const events: TelemetryEvent[] = [];

export function trackEvent(event: TelemetryEvent) {
  events.unshift(event);
  console.log("Telemetry:", event);
}

export function getEvents(): TelemetryEvent[] {
  return events;
}
