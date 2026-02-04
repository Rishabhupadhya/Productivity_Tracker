import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/auth.server";
import "./auth.css";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        if (password.length < 8) {
            return setError("Password must be at least 8 characters long.");
        }

        if (!token) return;

        setLoading(true);

        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-logo">Momentum</h1>
                    <p className="auth-tagline">Set your new password</p>
                </div>

                {success ? (
                    <div className="auth-success-state">
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                        <h2 style={{ color: "var(--success)", marginBottom: "8px" }}>Success!</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            Your password has been reset. Redirecting to login...
                        </p>
                        <Link to="/login" className="auth-button" style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-input-group">
                                <label htmlFor="password" className="auth-label">New Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || !token}
                                    className="auth-input"
                                    required
                                />
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="confirmPassword" className="auth-label">Confirm New Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading || !token}
                                    className="auth-input"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading || !token} className="auth-button">
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
