import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Adminlayout.css";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const basePath = location.pathname.startsWith("/admin-preview")
    ? "/admin-preview"
    : "/admin";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="lookfit-admin-layout">
      {/* HEADER CHUNG */}
      <header className="lookfit-admin-header">
        <div className="lookfit-admin-header-inner">
          {/* LOGO */}
          <Link to={basePath} className="lookfit-admin-brand">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png"
              alt="LookFit"
            />
            <span>ADMIN</span>
          </Link>

          {/* NAVIGATION */}
          <nav className="lookfit-admin-nav">
            <NavLink to={basePath} end>
              Dashboard
            </NavLink>

            <NavLink to={`${basePath}/catalog`}>
              Catalog
            </NavLink>

            <NavLink to={`${basePath}/predefined-outfits`}>
              Predefined Looks
            </NavLink>

            <NavLink to={`${basePath}/users`}>
              Community
            </NavLink>
          </nav>

          {/* LOGOUT BUTTON THẬT */}
          <button
            type="button"
            className="lookfit-admin-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* NỘI DUNG TRANG */}
      <Outlet />
    </div>
  );
}