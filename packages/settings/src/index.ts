export type TrainingSettings = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

export type FocusSettings = {
  focusSeconds: number;
  shortBreakSeconds: number;
  cycles: number;
};

export type UserSettings = {
  userId: string;
  training: TrainingSettings;
  focus: FocusSettings;
};

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
  training?: Partial<TrainingSettings>;
  focus?: Partial<FocusSettings>;
}): UserSettings {
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

  return next;
}
