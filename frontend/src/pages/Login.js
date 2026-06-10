import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please fill all fields"
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email,
            password,
          }
        );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          response.data.user
        )
      );

      navigate("/editor");
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          "Login Failed"
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
            IDE Login
          </h2>

          <p className="text-muted">
            Sign in to continue
          </p>

        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="mb-3">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              className="form-control"
              placeholder="Enter Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Password
            </label>

            <input
              type="password"
              className="form-control"
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(
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
              ? "Logging In..."
              : "Login"}
          </button>
        </form>

        <div className="text-center mt-3">

          <p>
            Don't have an
            account?{" "}
            <Link to="/register">
              Register
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;