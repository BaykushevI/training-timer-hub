type UserSettingsPageProps = {
  trainingWorkSeconds: number;
  trainingRestSeconds: number;
  trainingRounds: number;
  focusSeconds: number;
  focusShortBreakSeconds: number;
  focusCycles: number;
  isRunning: boolean;
  savingSettings: boolean;
  onTrainingWorkSecondsChange: (value: number) => void;
  onTrainingRestSecondsChange: (value: number) => void;
  onTrainingRoundsChange: (value: number) => void;
  onFocusSecondsChange: (value: number) => void;
  onFocusShortBreakSecondsChange: (value: number) => void;
  onFocusCyclesChange: (value: number) => void;
  onSave: () => void;
};

export function UserSettingsPage({
  trainingWorkSeconds,
  trainingRestSeconds,
  trainingRounds,
  focusSeconds,
  focusShortBreakSeconds,
  focusCycles,
  isRunning,
  savingSettings,
  onTrainingWorkSecondsChange,
  onTrainingRestSecondsChange,
  onTrainingRoundsChange,
  onFocusSecondsChange,
  onFocusShortBreakSecondsChange,
  onFocusCyclesChange,
  onSave,
}: UserSettingsPageProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-4 text-sm text-slate-400">Training Config</p>

        <div className="grid gap-3">
          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Work Seconds</span>
            <input
              type="number"
              min={5}
              value={trainingWorkSeconds}
              onChange={(e) =>
                onTrainingWorkSecondsChange(Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Rest Seconds</span>
            <input
              type="number"
              min={0}
              value={trainingRestSeconds}
              onChange={(e) =>
                onTrainingRestSecondsChange(Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Rounds</span>
            <input
              type="number"
              min={1}
              value={trainingRounds}
              onChange={(e) => onTrainingRoundsChange(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-4 text-sm text-slate-400">Focus Config</p>

        <div className="grid gap-3">
          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Focus Seconds</span>
            <input
              type="number"
              min={60}
              value={focusSeconds}
              onChange={(e) => onFocusSecondsChange(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Short Break Seconds</span>
            <input
              type="number"
              min={0}
              value={focusShortBreakSeconds}
              onChange={(e) =>
                onFocusShortBreakSecondsChange(Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-1 block">Cycles</span>
            <input
              type="number"
              min={1}
              value={focusCycles}
              onChange={(e) => onFocusCyclesChange(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        </div>
      </section>

      <div className="lg:col-span-2">
        <button
          onClick={onSave}
          disabled={savingSettings || isRunning}
          className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingSettings ? "Saving Settings..." : "Save Settings"}
        </button>

        {isRunning ? (
          <div className="mt-4 rounded-2xl border border-amber-900/40 bg-amber-950/30 p-5 text-sm text-amber-300">
            A session is currently active. Stop the session before changing
            settings. Active sessions use the config snapshot captured at start
            time and are not affected by settings changes.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-sky-900/40 bg-sky-950/30 p-5 text-sm text-sky-300">
            Settings are applied at session start. Changing them here will not
            affect any session already in progress.
          </div>
        )}
      </div>
    </div>
  );
}
