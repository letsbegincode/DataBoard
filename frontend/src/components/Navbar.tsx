import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        {user && <span>{user.email}</span>}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
