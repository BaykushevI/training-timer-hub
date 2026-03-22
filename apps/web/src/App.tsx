import { useState } from "react";
import type { SyntheticEvent } from "react";

type UserRole = "user" | "admin";

type LoggedInUser = {
  id: string;
  email: string;
  role: UserRole;
};

type LoginResponse = {
  user?: LoggedInUser;
  error?: string;
};

const API_BASE_URL = "http://localhost:8787";

function App() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123");
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.user) {
        setUser(null);
        setError(data.error ?? "Login failed");
        return;
      }

      setUser(data.user);
    } catch {
      setUser(null);
      setError("Unable to reach API");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setPassword("");
    setError("");
  }

  if (user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
          <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              Training Timer Hub
            </p>

            <h1 className="mb-4 text-4xl font-bold">Login successful</h1>

            <p className="mb-8 text-slate-300">
              This is the first authenticated UI state for the modular monolith.
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
              {user.role === "admin"
                ? "Admin access detected. Next we can route this role to an admin dashboard."
                : "Standard user access detected. Next we can route this role to the timer workspace."}
            </div>

            <div className="mt-8">
              <button
                onClick={handleLogout}
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-800 p-10 md:border-b-0 md:border-r">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              Training Timer Hub
            </p>

            <h1 className="mb-4 text-5xl font-bold leading-tight">
              L1 Login Flow
            </h1>

            <p className="mb-8 max-w-xl text-lg text-slate-300">
              First authenticated frontend slice for the modular monolith. The
              goal here is to validate UI → API → auth module → telemetry.
            </p>

            <div className="space-y-4 text-sm text-slate-400">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                Demo admin:{" "}
                <span className="text-slate-200">
                  admin@test.com / admin123
                </span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                Demo user:{" "}
                <span className="text-slate-200">user@test.com / user123</span>
              </div>
            </div>
          </div>

          <div className="p-10">
            <h2 className="mb-6 text-2xl font-semibold">Sign in</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
