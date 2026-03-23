import type { User } from "@repo/core";

const users: User[] = [
  {
    id: "1",
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
  },
  {
    id: "2",
    email: "user@test.com",
    password: "user123",
    role: "user",
  },
];

// In-memory token store: token → User
// Tokens are UUIDs created at login. For L1, tokens persist for the worker
// lifetime (cleared on restart). L2 would add expiry and persistent storage.
const tokenStore = new Map<string, User>();

export function login(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email);

  if (!user) return null;
  if (user.password !== password) return null;

  return user;
}

export function createToken(user: User): string {
  const token = crypto.randomUUID();
  tokenStore.set(token, user);
  return token;
}

export function validateToken(token: string): User | null {
  return tokenStore.get(token) ?? null;
}
