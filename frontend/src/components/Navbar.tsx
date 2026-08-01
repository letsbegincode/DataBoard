import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolveDisplayName } from "../lib/userGreeting";
import { ButtonPending } from "./Skeleton";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logout();
    navigate("/login");
  };

  const name = user ? resolveDisplayName(user) : "";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">DataBoard</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/data">Data</Link>
        <Link to="/plot">Plot</Link>
      </div>
      <div className="navbar-user">
        {user?.email && (
          <span className="navbar-greet" title={user.email}>
            Hi, {name}
          </span>
        )}
        <button onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? <ButtonPending label="Logging out…" /> : "Logout"}
        </button>
      </div>
    </nav>
  );
}
