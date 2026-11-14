import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, Ruler, Clock3, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Home.css";
import { useState } from "react";

export default function Home() {
const { user, logout } = useAuth();
console.log("Current logged-in user:", user);
const navigate = useNavigate();
const [showLogout, setShowLogout] = useState(false);


const handleLogout = async () => {
  try {
    await logout();
  } finally {
    setShowLogout(false);
    navigate("/", { replace: true });
  }
};

  const userName = user?.name || "";

  return (
    <div className="user-home">
      <header className="user-home-header">
        <div className="user-home-header-inner">
          <Link to="/home" className="user-home-logo">
  <img
    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png"
    alt="LookFit"
  />
</Link>

          <nav className="user-home-nav">
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/recommendation">Recommendation</NavLink>
            <NavLink to="/outfits/history">History</NavLink>
          </nav>

          
<div className="user-home-account">
  <button
    type="button"
    className="user-home-avatar-button"
    onClick={() => setShowLogout((prev) => !prev)}
    aria-label="Account menu"
    aria-expanded={showLogout}
  >
    <span className="user-home-avatar">
      {userName.charAt(0).toUpperCase() || "U"}
    </span>
  </button>

  {showLogout && (
    <div className="user-home-dropdown">
      <button
        type="button"
        className="user-home-logout"
        onClick={handleLogout}
      >
        Log out
      </button>
    </div>
  )}
</div>

        </div>
      </header>

      <main className="user-home-main">
        <p className="user-home-label">
          PERSONAL DASHBOARD <span>•</span> LOOKFIT
        </p>

        <h1 className="user-home-title">
          Welcome back,{" "}
          <span>{userName ? `${userName}.` : "."}</span>
        </h1>

        <p className="user-home-description">
          Your wardrobe is ready. Pick up where you left off or
          find a fresh way to wear what you already own.
        </p>

        <section className="user-home-cards">
          <Link
            to="/recommendation"
            className="user-home-card user-home-card-primary"
          >
            <div className="user-home-card-top">
              <span className="user-home-icon">
                <Sparkles size={22} />
              </span>
              <ArrowRight size={22} />
            </div>

            <div className="user-home-card-bottom">
              <p className="user-home-card-label">QUICK STYLING</p>
              <h2>Create a new look</h2>
              <p className="user-home-card-description">
                Build an outfit from your wardrobe in a few
                thoughtful steps.
              </p>
            </div>
          </Link>

          <Link to="/profile" className="user-home-card">
            <div className="user-home-card-top">
              <span className="user-home-icon">
                <Ruler size={22} />
              </span>
              <ArrowRight size={22} />
            </div>

            <div className="user-home-card-bottom">
              <p className="user-home-card-label">YOUR FIT</p>
              <h2>Complete your profile</h2>
              <p className="user-home-card-description">
                Add your measurements to make every
                recommendation more personal.
              </p>
            </div>
          </Link>

          <Link
            to="/outfits/history"
            className="user-home-card user-home-card-muted"
          >
            <div className="user-home-card-top">
              <span className="user-home-icon">
                <Clock3 size={22} />
              </span>
              <ArrowRight size={22} />
            </div>

            <div className="user-home-card-bottom">
              <p className="user-home-card-label">YOUR ACTIVITY</p>
              <h2>See recent looks</h2>
              <p className="user-home-card-description">
                Revisit the combinations you saved and loved.
              </p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
