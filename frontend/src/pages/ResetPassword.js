import React, { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || "";

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !otp || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (strength < 4) {
      setError("Password is too weak");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email, otp, newPassword }
      );
      setSuccess(response.data.message || "Password reset successfully");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "#0f172a" }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "480px",
          borderRadius: "16px",
          background: "#1e293b",
          border: "1px solid #334155",
          color: "white",
        }}
      >
        <div className="text-center mb-4">
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: "24px",
            }}
          >
            🔒
          </div>
          <h2 className="fw-bold" style={{ color: "#38bdf8" }}>Reset Password</h2>
          <p style={{ color: "#94a3b8" }}>Enter the OTP sent to your email</p>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: "#94a3b8", fontSize: "13px" }}>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "white", borderRadius: "8px" }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: "#94a3b8", fontSize: "13px" }}>OTP Code</label>
            <input
              type="text"
              maxLength="6"
              className="form-control text-center fw-bold"
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "#38bdf8", letterSpacing: "8px", fontSize: "20px", borderRadius: "8px" }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: "#94a3b8", fontSize: "13px" }}>New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Min 8 chars, uppercase, number, special"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "white", borderRadius: "8px" }}
            />
            {newPassword && (
              <div className="mt-2">
                <div style={{ height: "4px", background: "#334155", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(strength / 5) * 100}%`,
                      height: "100%",
                      background: strengthColor[strength],
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <small style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</small>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ color: "#94a3b8", fontSize: "13px" }}>Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                background: "#0f172a",
                border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? "#ef4444" : "#334155"}`,
                color: "white",
                borderRadius: "8px",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-semibold"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              border: "none",
              color: "white",
              fontSize: "15px",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
