import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !submitting) {
      navigate("/");
    }
  }, [user, navigate, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/");
      // Keep submitting=true until unmount so the UI doesn't flash idle
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(" "));
      } else {
        setError("Something went wrong");
      }
      setSubmitting(false);
    }
  };

  if (user && !submitting) return null;

  return (
    <div className={`login-page${submitting ? " login-page--busy" : ""}`}>
      <div className="login-card" aria-busy={submitting}>
        <p className="eyebrow">DataBoard</p>
        <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
        <p className="login-lead">
          {isRegister
            ? "Tell us your name, then create an account with a valid email and password (6–128 characters)."
            : "Sign in to manage private CSV datasets, compute stats, and plot charts."}
        </p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                autoComplete="name"
                disabled={submitting}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={submitting}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={submitting} className="login-submit">
            {submitting ? (
              <span className="btn-pending">
                <span className="btn-spinner" aria-hidden />
                {isRegister ? "Creating account…" : "Signing in…"}
              </span>
            ) : (
              isRegister ? "Register" : "Login"
            )}
          </button>
          {submitting && (
            <p className="login-status" role="status">
              Talking to the API — first request after idle can take a few seconds.
            </p>
          )}
        </form>
        <p className="toggle-auth">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (submitting) return;
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
