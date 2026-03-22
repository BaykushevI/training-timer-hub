type TrainingSettings = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

type FocusSettings = {
  focusSeconds: number;
  shortBreakSeconds: number;
  cycles: number;
};

type Session =
  | {
      id: string;
      userId: string;
      mode: "training";
      startedAt: number;
      status: "running" | "paused" | "stopped";
      pausedAt: number | null;
      totalPausedMs: number;
      configSnapshot: {
        mode: "training";
        training: TrainingSettings;
      };
    }
  | {
      id: string;
      userId: string;
      mode: "focus";
      startedAt: number;
      status: "running" | "paused" | "stopped";
      pausedAt: number | null;
      totalPausedMs: number;
      configSnapshot: {
        mode: "focus";
        focus: FocusSettings;
      };
    };

type HistoryRecord = {
  id: string;
  userId: string;
  mode: "training" | "focus";
  startedAt: number;
  endedAt: number;
  finalStatus: "stopped";
  configSnapshot: Record<string, unknown>;
};

type UserTimerPageProps = {
  tab: "training" | "focus";
  session: Session | null;
  history: HistoryRecord[];
  loading: boolean;
  now: number;
  onStartTraining: () => void;
  onStartFocus: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getEffectiveElapsedSeconds(session: Session, now: number) {
  const endTime =
    session.status === "paused" && session.pausedAt ? session.pausedAt : now;
  const elapsedMs = endTime - session.startedAt - session.totalPausedMs;
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

function getTrainingDerivedState(
  session: Extract<Session, { mode: "training" }>,
  now: number,
) {
  const { workSeconds, restSeconds, rounds } = session.configSnapshot.training;
  const totalCycleSeconds = workSeconds + restSeconds;
  const elapsedSeconds = getEffectiveElapsedSeconds(session, now);
  const totalProgramSeconds = totalCycleSeconds * rounds;

  const remainingProgramSeconds = Math.max(
    0,
    totalProgramSeconds - elapsedSeconds,
  );
  const completedCycles = Math.floor(elapsedSeconds / totalCycleSeconds);
  const currentRound = Math.min(rounds, completedCycles + 1);

  const secondsIntoCycle = elapsedSeconds % totalCycleSeconds;
  const inWorkPhase = secondsIntoCycle < workSeconds;

  const phase = inWorkPhase ? "work" : "rest";
  const phaseRemainingSeconds = inWorkPhase
    ? Math.max(0, workSeconds - secondsIntoCycle)
    : Math.max(0, totalCycleSeconds - secondsIntoCycle);

  return {
    currentRound,
    totalRounds: rounds,
    phase,
    phaseRemainingSeconds,
    remainingProgramSeconds,
  };
}

function getFocusDerivedState(
  session: Extract<Session, { mode: "focus" }>,
  now: number,
) {
  const { focusSeconds, shortBreakSeconds, cycles } =
    session.configSnapshot.focus;
  const totalCycleSeconds = focusSeconds + shortBreakSeconds;
  const elapsedSeconds = getEffectiveElapsedSeconds(session, now);
  const totalProgramSeconds = totalCycleSeconds * cycles;

  const remainingProgramSeconds = Math.max(
    0,
    totalProgramSeconds - elapsedSeconds,
  );
  const completedCycles = Math.floor(elapsedSeconds / totalCycleSeconds);
  const currentCycle = Math.min(cycles, completedCycles + 1);

  const secondsIntoCycle = elapsedSeconds % totalCycleSeconds;
  const inFocusPhase = secondsIntoCycle < focusSeconds;

  const phase = inFocusPhase ? "focus" : "break";
  const phaseRemainingSeconds = inFocusPhase
    ? Math.max(0, focusSeconds - secondsIntoCycle)
    : Math.max(0, totalCycleSeconds - secondsIntoCycle);

  return {
    currentCycle,
    totalCycles: cycles,
    phase,
    phaseRemainingSeconds,
    remainingProgramSeconds,
  };
}

export function UserTimerPage({
  tab,
  session,
  history,
  loading,
  now,
  onStartTraining,
  onStartFocus,
  onPause,
  onResume,
  onStop,
}: UserTimerPageProps) {
  const activeMode = session?.mode ?? null;
  const currentTabOwnsSession = activeMode === tab;
  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";

  let mainRemaining = "00:00";
  let secondaryLabel = "No active session";
  let secondaryValue = "--";

  if (session?.mode === "training" && session.status !== "stopped") {
    const derived = getTrainingDerivedState(session, now);
    mainRemaining = formatSeconds(derived.phaseRemainingSeconds);
    secondaryLabel = `Round ${derived.currentRound}/${derived.totalRounds}`;
    secondaryValue = `${derived.phase} phase · total left ${formatSeconds(
      derived.remainingProgramSeconds,
    )}`;
  }

  if (session?.mode === "focus" && session.status !== "stopped") {
    const derived = getFocusDerivedState(session, now);
    mainRemaining = formatSeconds(derived.phaseRemainingSeconds);
    secondaryLabel = `Cycle ${derived.currentCycle}/${derived.totalCycles}`;
    secondaryValue = `${derived.phase} phase · total left ${formatSeconds(
      derived.remainingProgramSeconds,
    )}`;
  }

  const title = tab === "training" ? "Training Timer" : "Focus Timer";
  const startLabel = tab === "training" ? "Start Training" : "Start Focus";
  const hasBlockingSession = !!session && session.status !== "stopped";
  const startDisabled = loading || hasBlockingSession;
  const pauseDisabled = loading || !isRunning || !currentTabOwnsSession;
  const resumeDisabled = loading || !isPaused || !currentTabOwnsSession;
  const stopDisabled =
    loading || (!isRunning && !isPaused) || !currentTabOwnsSession;

  const filteredHistory = history
    .filter((record) => record.mode === tab)
    .slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="mb-2 text-sm text-slate-400">{title}</p>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Mode</span>
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm capitalize text-slate-200">
              {session?.mode ?? "none"}
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Status</span>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                isRunning
                  ? "bg-emerald-500/15 text-emerald-300"
                  : isPaused
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-slate-800 text-slate-300"
              }`}
            >
              {session?.status ?? "idle"}
            </span>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-slate-400">Current Phase Time</p>
            <div className="text-5xl font-bold tracking-tight text-emerald-300">
              {mainRemaining}
            </div>
            <p className="mt-3 text-sm text-slate-300">{secondaryLabel}</p>
            <p className="mt-1 text-sm text-slate-500">{secondaryValue}</p>
          </div>

          {session ? (
            <p className="mt-4 text-sm text-slate-400">
              Started at {new Date(session.startedAt).toLocaleTimeString()}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No active session</p>
          )}
        </div>

        {!currentTabOwnsSession && hasBlockingSession ? (
          <div className="mb-4 rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
            A {activeMode} session is currently active. Stop it before starting
            a {tab} session.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {tab === "training" ? (
            <button
              onClick={onStartTraining}
              disabled={startDisabled}
              className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startLabel}
            </button>
          ) : (
            <button
              onClick={onStartFocus}
              disabled={startDisabled}
              className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startLabel}
            </button>
          )}

          <button
            onClick={onPause}
            disabled={pauseDisabled}
            className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Pause
          </button>

          <button
            onClick={onResume}
            disabled={resumeDisabled}
            className="rounded-xl bg-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resume
          </button>

          <button
            onClick={onStop}
            disabled={stopDisabled}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Stop Session
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-2 text-sm text-slate-400">Active Mode</p>
          <p className="text-lg font-semibold capitalize">
            {activeMode ?? "none"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-400">Recent Sessions</p>
            <span className="text-xs text-slate-500">Last 5</span>
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No session history yet.</p>
            ) : (
              filteredHistory.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium capitalize text-slate-100">
                      {record.mode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(record.endedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Started {new Date(record.startedAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-900/40 bg-sky-950/30 p-5 text-sky-300">
          Timer runtime and settings are now separated into dedicated workspace
          views.
        </div>
      </section>
    </div>
  );
}
