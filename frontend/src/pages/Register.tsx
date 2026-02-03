import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import GoogleSSOButton from "../components/auth/GoogleSSOButton";
import "./auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
      // Navigate immediately after successful registration
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">Momentum</h1>
          <p className="auth-tagline">Consistency that compounds</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Google SSO Button */}
        <GoogleSSOButton 
          onError={(err) => setError(err)}
          redirectUrl="/dashboard"
          mode="register"
        />

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="name" className="auth-label">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="auth-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
