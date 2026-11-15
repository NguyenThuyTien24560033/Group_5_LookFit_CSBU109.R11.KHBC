import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import "./Adminlayout.css";

export default function AdminLayout() {
  const location = useLocation();

  const basePath = location.pathname.startsWith("/admin-preview")
    ? "/admin-preview"
    : "/admin";

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

          {/* LOGOUT */}
          <Link to="/" className="lookfit-admin-logout">
            Logout
          </Link>
        </div>
      </header>

      {/* NỘI DUNG TRANG */}
      <Outlet />
    </div>
  );
}