import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import API, { clearAuthToken, setAuthToken } from "./api/api";
import Login from "./auth/login.tsx";
import Register from "./auth/register.tsx";
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
  const [isBootstrapping, setIsBootstrapping] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute = ["/login", "/register"].includes(location.pathname);
  const isLoginRoute = location.pathname === "/login";
  const isRegisterRoute = location.pathname === "/register";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isWorkspaceRoute = location.pathname.startsWith("/workspaces");
  const headerTitle = isLoginRoute
    ? "Login"
    : isRegisterRoute
      ? "Register"
      : isDashboardRoute
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
      .catch(() => setCurrentUser(null))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      clearAuthToken();
      setCurrentUser(null);
      navigate("/login");
    }
  };

  if (isBootstrapping) {
    return null;
  }

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
            <div className="user-pill user-actions">
              <span className="user-label">Signed in</span>
              <span className="user-email">{currentUser.email}</span>
              <strong className="user-id">USER ID: {currentUser.id}</strong>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
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
            <div className="user-pill user-actions">
              <span className="user-label">Signed in</span>
              <span className="user-email">{currentUser.email}</span>
              <strong className="user-id">USER ID: {currentUser.id}</strong>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
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
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onAuth={setCurrentUser} />
              )
            }
          />
          <Route
            path="/register"
            element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register onAuth={setCurrentUser} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              currentUser ? (
                <Dashboard currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/workspaces"
            element={
              currentUser ? <Workspaces /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/workspaces/create"
            element={
              currentUser ? (
                <CreateWorkspace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/workspaces/options"
            element={
              currentUser ? (
                <WorkspaceOptions />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
