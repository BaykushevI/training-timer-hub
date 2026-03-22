export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}
