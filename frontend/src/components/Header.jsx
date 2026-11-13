import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="site-logo" to="/">
          LFit
        </Link>

        <div className="site-nav-links">
          {!user && (
            <>
              <Link to="/">Home</Link>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}

          {user?.role === "USER" && (
            <>
              <Link to="/">Home</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/recommendation">Recommendation</Link>
              <Link to="/outfits/history">History</Link>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/catalog">Catalog</Link>
              <Link to="/admin/predefined-outfits">
                Predefined Outfits
              </Link>
              <Link to="/admin/users">User Management</Link>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
