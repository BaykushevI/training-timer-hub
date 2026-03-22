import type { LoggedInUser } from "./LoginPage";

type UserHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function UserHome({ user, onLogout }: UserHomeProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Training Timer Hub
          </p>

          <h1 className="mb-4 text-4xl font-bold">User access granted</h1>

          <p className="mb-8 text-slate-300">
            This is the first authenticated user state. Later this will become
            the timer workspace.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-1 text-sm text-slate-400">User ID</p>
              <p className="text-lg font-semibold">{user.id}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-1 text-sm text-slate-400">Email</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-1 text-sm text-slate-400">Role</p>
              <p className="text-lg font-semibold capitalize">{user.role}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-900/40 bg-sky-950/30 p-5 text-sky-300">
            Standard user role detected. Next step: route this screen to timer
            modes, active session view, and session history.
          </div>

          <div className="mt-8">
            <button
              onClick={onLogout}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-medium text-slate-100 transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
