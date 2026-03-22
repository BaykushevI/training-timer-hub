import { useState } from "react";
import type { SyntheticEvent } from "react";

type UserRole = "user" | "admin";

export type LoggedInUser = {
  id: string;
  email: string;
  role: UserRole;
};

type LoginResponse = {
  user?: LoggedInUser;
  error?: string;
};

type LoginPageProps = {
  onLogin: (user: LoggedInUser) => void;
};

const API_BASE_URL = "http://localhost:8787";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123");
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
        setError(data.error ?? "Login failed");
        return;
      }

      onLogin(data.user);
    } catch {
      setError("Unable to reach API");
    } finally {
      setIsLoading(false);
    }
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
