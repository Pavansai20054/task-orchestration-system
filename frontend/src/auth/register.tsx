import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../api/api";

type CurrentUser = {
  id: number;
  email: string;
};

type RegisterProps = {
  onAuth: (user: CurrentUser) => void;
};

export default function Register({ onAuth }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isValidEmail = (value: string) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

  const handleRegister = async () => {
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

      await API.post("/auth/register", {
        email,
        password,
      });

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
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setError(detail ?? "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card card-elevated">
      <div className="card-header">
        <p className="card-kicker">Get started</p>
        <h2 className="card-title">Create your account</h2>
        <p className="card-subtitle">Set up your workspace in minutes.</p>
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
          <div className="password-field">
            <input
              placeholder="Choose a strong password"
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <p className="hint-text">
          Use 8+ chars with uppercase, lowercase, number, and special character.
        </p>
        {error ? <p className="form-error">{error}</p> : null}
        <button
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? "Working..." : "Create account"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <div className="card-footer">
        <span className="hint">By registering you agree to basic usage.</span>
      </div>
    </section>
  );
}
