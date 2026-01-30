import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/auth.server";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", email);
      const data = await loginUser(email, password);
      console.log("Login successful, token received:", data.token ? "Yes" : "No");
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Login failed. Please check your credentials.";
      console.log("Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', background: '#0b0f14', minHeight: '100vh' }}>
      <div className="auth-container" style={{ background: '#1a1a1a', padding: '2rem', maxWidth: '400px', margin: '100px auto', borderRadius: '8px', border: '1px solid #00ffff' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '20px', textAlign: 'center' }}>Login to Productivity Tracker</h2>

        {error && <p style={{ color: '#ff4444', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #00ffff', borderRadius: '4px', background: '#0a0a0a', color: '#00ffff', fontSize: '16px' }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #00ffff', borderRadius: '4px', background: '#0a0a0a', color: '#00ffff', fontSize: '16px' }}
          />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#666' : '#00ffff', color: '#000', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#00ffff' }}>
          Don't have an account? <Link to="/register" style={{ color: '#00ffff', textDecoration: 'underline' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
