
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import "./UserLayout.css";

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png";

export default function UserLayout() {
  return (
    <main className="user-auth-page">
      <div className="user-auth-container">

        <Link to="/" className="user-auth-back">
          <ArrowLeft size={15} />
          Back to LookFit
        </Link>

        <section className="user-auth-card">

          {/* LEFT PANEL - SHARED */}
          <div className="user-auth-brand">
            <div className="user-auth-brand-content">

              <Link to="/" className="user-auth-logo">
                <img src={LOGO_URL} alt="LookFit" />
              </Link>

              <div className="user-auth-intro">
                <span className="user-auth-eyebrow">
                  YOUR PERSONAL STYLING STUDIO
                </span>

                <h1>
                  Style that feels like
                  <br />
                  <em>you.</em>
                </h1>

                <p className="user-auth-description">
                  Save your edits, discover new looks,
                  and make every outfit feel intentional.
                </p>

                <div className="user-auth-benefits">
                  <div>
                    <Check size={15} />
                    <span>Personalised outfit edits</span>
                  </div>

                  <div>
                    <Check size={15} />
                    <span>Your looks, saved securely</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL - CHANGES BY ROUTE */}
          <div className="user-auth-form-panel">
            <Outlet />
          </div>

        </section>
      </div>
    </main>
  );
}
