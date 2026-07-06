import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/forgot-password`,
        { email }
      );
      setSuccess(response.data.message || "OTP sent to email");
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Request Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div
        className="card shadow-lg p-4 text-white"
        style={{
          width: "450px",
          borderRadius: "15px",
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: "#38bdf8" }}>Forgot Password</h2>
          <p className="text-muted">Enter your email to receive a reset OTP</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted">Email Address</label>
            <input
              type="email"
              className="form-control bg-secondary text-white border-0"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#0284c7",
              border: "none",
            }}
          >
            {loading ? "Sending OTP..." : "Send Reset Code"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted mb-0">
            Remembered your password?{" "}
            <Link to="/" className="text-info text-decoration-none">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
