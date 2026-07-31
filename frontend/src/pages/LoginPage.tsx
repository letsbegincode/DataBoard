import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(" "));
      } else {
        setError("Something went wrong");
      }
    }
  };

  if (user) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="eyebrow">DataBoard</p>
        <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
        <p className="login-lead">
          {isRegister
            ? "Create an account with a valid email and password (min 6 characters)."
            : "Sign in to manage private CSV datasets, compute stats, and plot charts."}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit">{isRegister ? "Register" : "Login"}</button>
        </form>
        <p className="toggle-auth">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button type="button" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
