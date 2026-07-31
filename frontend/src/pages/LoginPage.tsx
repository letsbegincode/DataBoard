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
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong");
    }
  };

  if (user) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isRegister ? "Register" : "Login"}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
