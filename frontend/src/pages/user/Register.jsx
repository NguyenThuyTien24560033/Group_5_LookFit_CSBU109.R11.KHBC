
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, LockKeyhole, UserRound, Check } from "lucide-react";
import { register } from "../../services/auth.service";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({ name, email, password });

      navigate("/login", {
        replace: true,
        state: {
          message:
            result.message ||
            "Registration successful. Please log in.",
          email,
        },
      });
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-container">
        <Link to="/" className="register-back">
          <ArrowLeft size={16} />
          Back to LookFit
        </Link>

        <section className="register-card">
          {/* LEFT PANEL */}
          <div className="register-intro">
            <Link to="/" className="register-logo">
              LookFit
            </Link>

            <div className="register-intro-content">
              <span className="register-eyebrow">
                YOUR PERSONAL STYLING STUDIO
              </span>

              <h1>
                Style that feels like
                <br />
                <em>you.</em>
              </h1>

              <p>
                Save your edits, discover new looks, and
                make every outfit feel intentional.
              </p>

              <div className="register-benefits">
                <span>
                  <Check size={15} />
                  Personalised outfit edits
                </span>
                <span>
                  <Check size={15} />
                  Your looks, saved securely
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="register-form-panel">
            <span className="register-eyebrow">
              JOIN THE COMMUNITY
            </span>

            <h2>Create your account</h2>

            <form
              onSubmit={handleSubmit}
              className="register-form"
            >
              <div className="register-field">
                <label htmlFor="register-name">
                  <UserRound size={15} />
                  Full name
                </label>
                <input
                  id="register-name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-email">
                  <Mail size={15} />
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-password">
                  <LockKeyhole size={15} />
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-confirm">
                  <LockKeyhole size={15} />
                  Confirm password
                </label>
                <input
                  id="register-confirm"
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={8}
                  required
                />
              </div>

              {message && (
                <p className="register-message" role="alert">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="register-login-link">
              Already have an account?{" "}
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
