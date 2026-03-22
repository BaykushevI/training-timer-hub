import { useState } from "react";
import { AdminHome } from "./pages/AdminHome";
import { LoginPage } from "./pages/LoginPage";
import type { LoggedInUser } from "./pages/LoginPage";
import { UserHome } from "./pages/UserHome";

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  if (user.role === "admin") {
    return <AdminHome user={user} onLogout={() => setUser(null)} />;
  }

  return <UserHome user={user} onLogout={() => setUser(null)} />;
}

export default App;
