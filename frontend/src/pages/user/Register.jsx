
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, LockKeyhole } from "lucide-react";
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

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            result.message ||
            "Registration successful. Please log in.",
          email: email.trim(),
        },
      });
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-content">
      <span className="register-eyebrow">
        JOIN THE COMMUNITY
      </span>

      <h2>Create your account</h2>

      <form
        onSubmit={handleSubmit}
        className="lookfit-register-form"
      >
        {/* FULL NAME */}
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
            onChange={(event) =>
              setName(event.target.value)
            }
            required
          />
        </div>

        {/* EMAIL */}
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
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="register-field">
          <label htmlFor="register-password">
            <LockKeyhole size={15} />
            Password
          </label>

          <input
            id="register-password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={8}
            required
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="register-field">
          <label htmlFor="register-confirm-password">
            <LockKeyhole size={15} />
            Confirm password
          </label>

          <input
            id="register-confirm-password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            required
          />
        </div>

        {/* ERROR MESSAGE */}
        {message && (
          <p className="register-message" role="alert">
            {message}
          </p>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          className="register-submit"
          disabled={loading}
        >
          {loading
            ? "Creating account..."
            : "Create account"}
        </button>
      </form>

      <p className="register-login">
        Already have an account?{" "}
        <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
