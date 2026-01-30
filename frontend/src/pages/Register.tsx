import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/auth.server";

export default function Register() {
  const [name, setName] = useState("");
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
      const data = await registerUser(name, email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', background: '#0b0f14', minHeight: '100vh' }}>
      <div style={{ background: '#1a1a1a', padding: '2rem', maxWidth: '400px', margin: '100px auto', borderRadius: '8px', border: '1px solid #00ffff' }}>
        <h2 style={{ color: '#00ffff', marginBottom: '20px', textAlign: 'center' }}>Register</h2>
        {error && <p style={{ color: '#ff4444', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            placeholder="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #00ffff', borderRadius: '4px', background: '#0a0a0a', color: '#00ffff', fontSize: '16px' }}
          />
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
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', color: '#00ffff' }}>
          Already have an account? <Link to="/login" style={{ color: '#00ffff', textDecoration: 'underline' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
