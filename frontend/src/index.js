import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ProtectedRoute from "./components/ProtectedRoute";
import App from "./App";
import bootstrap from "bootstrap/dist/css/bootstrap.min.css";
const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/editor" element={<ProtectedRoute><App /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);