import type { LoggedInUser } from "./LoginPage";

type AdminHomeProps = {
  user: LoggedInUser;
  onLogout: () => void;
};

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Training Timer Hub
          </p>

          <h1 className="mb-4 text-4xl font-bold">Admin access granted</h1>

          <p className="mb-8 text-slate-300">
            This is the first authenticated admin state. Later this will become
            the operational dashboard.
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

          <div className="mt-8 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-5 text-emerald-300">
            Admin role detected. Next step: route this screen to the admin
            dashboard, telemetry overview, and alert management.
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
