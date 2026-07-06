import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[@$!%*?&]/.test(pw)) score++;
    return score;
  };

  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const strength = getStrength(password);

  const passwordChecks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", ok: /[a-z]/.test(password) },
    { label: "Number (0-9)", ok: /\d/.test(password) },
    { label: "Special character (@$!%*?&)", ok: /[@$!%*?&]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return;
    }
    if (strength < 4) {
      setError("Password is too weak. Satisfy all requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/register`, { name, email, password });
      setSuccess(response.data.message || "Registration successful! Check your email.");
      setTimeout(() => navigate("/verify-otp", { state: { email } }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: "10px",
    background: "#1e293b", border: "1px solid #334155", color: "white",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: "500px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: "22px",
          }}>✦</div>
          <h2 style={{ color: "white", fontWeight: 700, fontSize: "26px", margin: 0 }}>Create Account</h2>
          <p style={{ color: "#64748b", marginTop: "6px", fontSize: "14px" }}>Join OnlineCodX — it's free</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 14px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", color: "#86efac", padding: "10px 14px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Full Name</label>
            <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email Address</label>
            <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "16px" }}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {password && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ flex: 1, height: "4px", borderRadius: "4px", background: i <= strength ? strengthColor[strength] : "#334155", transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                  {passwordChecks.map((chk, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: chk.ok ? "#22c55e" : "#64748b" }}>
                      <span>{chk.ok ? "✓" : "○"}</span>
                      <span>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={{
                ...inputStyle,
                border: `1px solid ${confirmPassword && password !== confirmPassword ? "#ef4444" : "#334155"}`,
              }}
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: "10px",
              background: loading ? "#334155" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
              border: "none", color: "white", fontWeight: 700, fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={{ color: "#64748b", textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;