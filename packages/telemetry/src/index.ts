type TelemetryEvent = {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const events: TelemetryEvent[] = [];

export function trackEvent(event: TelemetryEvent) {
  events.push(event);
  console.log("Telemetry:", event);
}

export function getEvents() {
  return events;
}
