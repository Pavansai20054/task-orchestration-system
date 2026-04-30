import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import API, { setAuthToken } from "./api/api";
import Login from "./pages/login.tsx";
import Register from "./pages/register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Workspaces from "./pages/Workspaces.tsx";
import CreateWorkspace from "./pages/CreateWorkspace.tsx";
import WorkspaceOptions from "./pages/WorkspaceOptions.tsx";

type CurrentUser = {
  id: number;
  email: string;
};

function AppLayout() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const location = useLocation();
  const isAuthRoute = ["/login", "/register"].includes(location.pathname);
  const isDashboardRoute = location.pathname === "/dashboard";
  const isWorkspaceRoute = location.pathname.startsWith("/workspaces");
  const headerTitle = isDashboardRoute
    ? "Dashboard"
    : isWorkspaceRoute && location.pathname.includes("/create")
      ? "Create workspace"
      : isWorkspaceRoute && location.pathname.includes("/options")
        ? "Workspace options"
        : isWorkspaceRoute
          ? "Workspaces"
          : "Bring focus to every workspace";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setAuthToken(token);
    API.get("/users/me")
      .then((res) => setCurrentUser(res.data))
      .catch(() => setCurrentUser(null));
  }, []);

  return (
    <div className="app-shell">
      {isDashboardRoute || isWorkspaceRoute ? (
        <header className="app-header app-header-compact">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="brand-eyebrow">Task Orchestration</p>
              <h1 className="brand-title">{headerTitle}</h1>
            </div>
          </div>
          {currentUser ? (
            <div className="user-pill">
              <span className="user-label">Signed in</span>
              <span className="user-email">{currentUser.email}</span>
            </div>
          ) : null}
        </header>
      ) : (
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="brand-eyebrow">Task Orchestration</p>
              <h1 className="brand-title">{headerTitle}</h1>
            </div>
          </div>
          <p className="brand-subtitle">
            Plan, assign, and execute work with calm clarity.
          </p>
          {currentUser ? (
            <div className="user-pill">
              <span className="user-label">Signed in</span>
              <span className="user-email">{currentUser.email}</span>
            </div>
          ) : null}
        </header>
      )}

      <div
        className={`app-grid ${isAuthRoute || isWorkspaceRoute ? "single" : ""}`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={currentUser ? "/dashboard" : "/login"} replace />
            }
          />
          <Route path="/login" element={<Login onAuth={setCurrentUser} />} />
          <Route
            path="/register"
            element={<Register onAuth={setCurrentUser} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard currentUser={currentUser} />}
          />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/create" element={<CreateWorkspace />} />
          <Route path="/workspaces/options" element={<WorkspaceOptions />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
