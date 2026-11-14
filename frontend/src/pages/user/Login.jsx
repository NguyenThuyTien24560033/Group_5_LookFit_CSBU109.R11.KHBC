
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, LockKeyhole } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-content">
      <span className="login-eyebrow">
        WELCOME BACK
      </span>

      <h2>Log in to LookFit</h2>

      <form
        onSubmit={handleSubmit}
        className="lookfit-login-form"
      >
        <div className="login-field">
          <label htmlFor="email">
            <Mail size={15} />
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">
            <LockKeyhole size={15} />
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {message && (
          <p className="login-message" role="alert">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="login-submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="login-register">
        New to LookFit?{" "}
        <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
