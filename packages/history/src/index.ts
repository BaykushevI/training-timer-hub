export type HistoryRecord = {
  id: string;
  userId: string;
  mode: "training" | "focus";
  startedAt: number;
  endedAt: number;
  finalStatus: "stopped";
  configSnapshot: Record<string, unknown>;
};

const historyStore = new Map<string, HistoryRecord[]>();

function generateHistoryId() {
  return crypto.randomUUID();
}

export function addHistoryRecord(params: {
  userId: string;
  mode: "training" | "focus";
  startedAt: number;
  endedAt: number;
  finalStatus: "stopped";
  configSnapshot: Record<string, unknown>;
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
