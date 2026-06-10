import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword,
    setConfirmPassword] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  const [error,
    setError] =
    useState("");

  const [success,
    setSuccess] =
    useState("");

  const validatePassword =
    (password) => {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

      return regex.test(
        password
      );
    };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");
      setSuccess("");

      if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        setError(
          "Please fill all fields"
        );
        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          email
        )
      ) {
        setError(
          "Invalid email format"
        );
        return;
      }

      if (
        !validatePassword(
          password
        )
      ) {
        setError(
          "Password must contain uppercase, lowercase, number and special character"
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match"
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await axios.post(
            "http://localhost:5000/api/auth/register",
            {
              name,
              email,
              password,
            }
          );

        setSuccess(
          response.data
            .message ||
            "Registration successful"
        );

        setTimeout(() => {
          navigate(
            "/verify-otp",
            {
              state: {
                email,
              },
            }
          );
        }, 1500);

      } catch (err) {

        setError(
          err.response?.data
            ?.message ||
            "Registration failed"
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
          width: "500px",
          borderRadius: "15px",
        }}
      >

        <div className="text-center mb-4">

          <h2>
            Create Account
          </h2>

          <p className="text-muted">
            Register to use IDE
          </p>

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
            handleSubmit
          }
        >

          <div className="mb-3">

            <label className="form-label">
              Full Name
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter Name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
            />

          </div>

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

            <small className="text-muted">
              Min 8 chars,
              uppercase,
              lowercase,
              number &
              special char
            </small>

          </div>

          <div className="mb-3">

            <label className="form-label">
              Confirm Password
            </label>

            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={
              loading
            }
          >
            {loading
              ? "Creating Account..."
              : "Register"}
          </button>

        </form>

        <div className="text-center mt-3">

          <p>
            Already have an account?{" "}
            <Link to="/">
              Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}

export default Register;