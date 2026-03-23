import type { HistoryRecord, HistoryFinalStatus, SessionConfigSnapshot, SessionMode } from "@repo/core";

export type { HistoryRecord, HistoryFinalStatus };

const historyStore = new Map<string, HistoryRecord[]>();

function generateHistoryId() {
  return crypto.randomUUID();
}

export function addHistoryRecord(params: {
  userId: string;
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  finalStatus: HistoryFinalStatus;
  configSnapshot: SessionConfigSnapshot;
}): HistoryRecord {
  const record: HistoryRecord = {
    id: generateHistoryId(),
    userId: params.userId,
    mode: params.mode,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    finalStatus: params.finalStatus,
    configSnapshot: params.configSnapshot,
  };

  const existing = historyStore.get(params.userId) ?? [];
  historyStore.set(params.userId, [record, ...existing]);

  return record;
}

export function getHistoryForUser(userId: string): HistoryRecord[] {
  return historyStore.get(userId) ?? [];
}
