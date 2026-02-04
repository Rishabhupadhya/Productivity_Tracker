import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth.server";
import "./auth.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const result = await forgotPassword(email);
            setMessage(result.message || "Reset link has been generated.");
            setSubmitted(true);

            // In this dev environment we show the token if available
            if (result.resetToken) {
                console.log("Reset Token:", result.resetToken);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to request password reset.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-logo">Momentum</h1>
                    <p className="auth-tagline">Recover your account</p>
                </div>

                {submitted ? (
                    <div className="auth-success-state">
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
                        <h2 style={{ color: "var(--accent)", marginBottom: "8px" }}>Check your inbox</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            {message}
                        </p>
                        <Link to="/login" className="auth-button" style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && <div className="auth-error">{error}</div>}

                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "14px", textAlign: "center" }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-input-group">
                                <label htmlFor="email" className="auth-label">Email Address</label>
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

                            <button type="submit" disabled={loading} className="auth-button">
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>

                        <div className="auth-footer">
                            Remember your password?
                            <Link to="/login" className="auth-link">Sign in</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
