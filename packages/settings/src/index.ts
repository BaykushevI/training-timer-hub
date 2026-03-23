import type { UserSettings, TrainingConfig, FocusConfig } from "@repo/core";

export type { UserSettings, TrainingConfig, FocusConfig };

const settingsStore = new Map<string, UserSettings>();

function getDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    training: {
      workSeconds: 60,
      restSeconds: 10,
      rounds: 6,
    },
    focus: {
      focusSeconds: 1500,
      shortBreakSeconds: 300,
      cycles: 4,
    },
  };
}

function validateTraining(training: Partial<TrainingConfig>): string | null {
  if (training.workSeconds !== undefined && training.workSeconds < 1) {
    return "workSeconds must be at least 1";
  }
  if (training.restSeconds !== undefined && training.restSeconds < 0) {
    return "restSeconds cannot be negative";
  }
  if (training.rounds !== undefined && training.rounds < 1) {
    return "rounds must be at least 1";
  }
  return null;
}

function validateFocus(focus: Partial<FocusConfig>): string | null {
  if (focus.focusSeconds !== undefined && focus.focusSeconds < 1) {
    return "focusSeconds must be at least 1";
  }
  if (focus.shortBreakSeconds !== undefined && focus.shortBreakSeconds < 0) {
    return "shortBreakSeconds cannot be negative";
  }
  if (focus.cycles !== undefined && focus.cycles < 1) {
    return "cycles must be at least 1";
  }
  return null;
}

export function getUserSettings(userId: string): UserSettings {
  const existing = settingsStore.get(userId);

  if (existing) {
    return existing;
  }

  const defaults = getDefaultSettings(userId);
  settingsStore.set(userId, defaults);

  return defaults;
}

export function updateUserSettings(params: {
  userId: string;
  training?: Partial<TrainingConfig>;
  focus?: Partial<FocusConfig>;
}): { settings: UserSettings } | { error: string } {
  if (params.training) {
    const err = validateTraining(params.training);
    if (err) return { error: err };
  }

  if (params.focus) {
    const err = validateFocus(params.focus);
    if (err) return { error: err };
  }

  const current = getUserSettings(params.userId);

  const next: UserSettings = {
    ...current,
    training: {
      ...current.training,
      ...params.training,
    },
    focus: {
      ...current.focus,
      ...params.focus,
    },
  };

  settingsStore.set(params.userId, next);

  return { settings: next };
}
