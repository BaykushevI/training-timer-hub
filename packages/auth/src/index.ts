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

export function login(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email);

  if (!user) return null;
  if (user.password !== password) return null;

  return user;
}
