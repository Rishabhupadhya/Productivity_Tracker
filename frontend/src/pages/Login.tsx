import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import GoogleSSOButton from "../components/auth/GoogleSSOButton";
import "./auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();
  const [searchParams] = useSearchParams();

  // Check for OAuth errors in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam === 'no_account') {
      setError(messageParam || 'Account not found. Please register first.');
    } else if (errorParam) {
      setError(messageParam || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Navigate immediately after successful login
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
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

        {error && (
          <div className="auth-error">
            {error}
            {error.includes('Account not found') && (
              <div style={{ marginTop: '8px' }}>
                <Link to="/register" style={{ color: 'inherit', textDecoration: 'underline' }}>
                  Create an account →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Google SSO Button */}
        <GoogleSSOButton 
          onError={(err) => setError(err)}
          redirectUrl="/dashboard"
        />

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-link">Create one</Link>
        </div>
      </div>
    </div>
  );
}
