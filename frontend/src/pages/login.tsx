import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../api/api";

type CurrentUser = {
  id: number;
  email: string;
};

type LoginProps = {
  onAuth: (user: CurrentUser) => void;
};

export default function Login({ onAuth }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isValidEmail = (value: string) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required");
        return;
      }

      if (!isValidEmail(email)) {
        setError("Enter a valid email address");
        return;
      }

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.access_token;

      localStorage.setItem("token", token);
      setAuthToken(token);

      const me = await API.get("/users/me");
      onAuth(me.data);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card card-elevated">
      <div className="card-header">
        <p className="card-kicker">Sign in</p>
        <h2 className="card-title">Welcome back</h2>
        <p className="card-subtitle">Access your workspaces and tasks.</p>
      </div>

      <div className="form">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@company.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            placeholder="••••••••"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Working..." : "Login"}
        </button>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
      <div className="card-footer">
        <span className="hint">
          Tip: Use the same email you registered with.
        </span>
      </div>
    </section>
  );
}
