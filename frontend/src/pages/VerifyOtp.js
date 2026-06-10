import React, { useState } from "react";
import axios from "axios";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email =
    location.state?.email || "";

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleVerify =
    async (e) => {
      e.preventDefault();

      setError("");
      setSuccess("");

      if (!otp) {
        setError(
          "Please enter OTP"
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await axios.post(
            "http://localhost:5000/api/auth/verify-otp",
            {
              email,
              otp,
            }
          );

        setSuccess(
          response.data.message
        );

        setTimeout(() => {
          navigate("/");
        }, 2000);

      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "OTP Verification Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">

      <div
        className="card shadow p-4"
        style={{
          width: "450px",
          borderRadius: "15px",
        }}
      >
        <div className="text-center mb-4">
          <h2>
            Verify OTP
          </h2>

          <p className="text-muted">
            OTP sent to
          </p>

          <strong>
            {email}
          </strong>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form
          onSubmit={
            handleVerify
          }
        >
          <div className="mb-3">

            <label className="form-label">
              Enter OTP
            </label>

            <input
              type="text"
              maxLength="6"
              className="form-control text-center"
              placeholder="Enter 6 Digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                )
              }
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={
              loading
            }
          >
            {loading
              ? "Verifying..."
              : "Verify OTP"}
          </button>
        </form>

        <div className="text-center mt-3">

          <button
            className="btn btn-link"
            onClick={() =>
              navigate("/register")
            }
          >
            Back to Register
          </button>

        </div>

      </div>
    </div>
  );
}

export default VerifyOtp;