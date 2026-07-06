import React, { useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logo.jpg";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/login`, { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(() => {
    setGoogleLoading(true);
    setError("");
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Login is not configured. Please add REACT_APP_GOOGLE_CLIENT_ID to your .env file.");
      setGoogleLoading(false);
      return;
    }
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent("email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=12345`;

    const popup = window.open(url, "google-login", "width=500,height=600");
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          setGoogleLoading(false);
          return;
        }
        const hash = popup.location.hash;
        if (hash && hash.includes("id_token")) {
          clearInterval(interval);
          popup.close();
          const params = new URLSearchParams(hash.substring(1));
          const idToken = params.get("id_token");
          // Send token to backend
          axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google-login`, { token: idToken })
            .then((response) => {
              localStorage.setItem("token", response.data.token);
              localStorage.setItem("user", JSON.stringify(response.data.user));
              navigate("/dashboard");
            })
            .catch((err) => {
              setError(err.response?.data?.message || "Google Login Failed");
            })
            .finally(() => setGoogleLoading(false));
        }
      } catch (_) {}
    }, 500);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* Left branding panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "linear-gradient(160deg, #0ea5e9 0%, #6366f1 100%)",
        }}
        className="d-none d-lg-flex"
      >
        <div style={{ color: "white" }}>
          <img src={logo} alt="OnlineCodX" style={{ height: "64px", marginBottom: "20px", borderRadius: "12px" }} />
          <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: 1.6, marginBottom: "32px" }}>
            A professional cloud-based IDE and document management platform.
            Write, compile, and execute code in 5 languages.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {["⚡ C, C++, Java, Python, JavaScript", "📄 PDF & DOCX Viewer", "🤖 AI Code Analysis", "☁️ Cloud Storage & Projects"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "15px", opacity: 0.9 }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ width: "480px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: "28px", marginBottom: "8px" }}>Welcome back</h2>
            <p style={{ color: "#64748b" }}>Sign in to your OnlineCodX account</p>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: "100%", padding: "12px", borderRadius: "10px",
              background: "white", border: "none", color: "#1e293b",
              fontWeight: 600, fontSize: "15px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              marginBottom: "20px", transition: "opacity 0.2s",
              opacity: googleLoading ? 0.7 : 1,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
            <span style={{ color: "#475569", fontSize: "13px" }}>or sign in with email</span>
            <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  background: "#1e293b", border: "1px solid #334155", color: "white",
                  fontSize: "15px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ color: "#94a3b8", fontSize: "13px" }}>Password</label>
                <Link to="/forgot-password" style={{ color: "#38bdf8", fontSize: "13px", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: "100%", padding: "12px 44px 12px 16px", borderRadius: "10px",
                    background: "#1e293b", border: "1px solid #334155", color: "white",
                    fontSize: "15px", outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "16px" }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: "10px",
                background: loading ? "#334155" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                border: "none", color: "white", fontWeight: 700, fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer", marginTop: "8px",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ color: "#64748b", textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;