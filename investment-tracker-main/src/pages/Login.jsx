import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error: serverError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const validate = (name, value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let error = "";
    if (name === "email") {
      const val = value.trim();
      if (!val) error = "Email is required";
      else if (!emailRegex.test(val)) error = "Please enter a valid email address";
    }
    if (name === "password") {
      if (!value) error = "Password is required";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error dynamically
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validate(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Login Page] Submit button clicked. Form data:", { ...formData, password: "[REDACTED]" });

    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validate(key, formData[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      console.warn("[Login Page] Validation errors prevent submit:", errors);
      setFieldErrors(errors);
      return;
    }

    try {
      console.log("[Login Page] Dispatching loginUser action...");
      const normalizedData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      const result = await dispatch(loginUser(normalizedData)).unwrap();
      console.log("[Login Page] loginUser resolved successfully. Payload returned:", result);
      console.log("[Login Page] Redirecting user to /dashboard...");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ [Login Page] Login error caught in component:", err);
    }
  };

  const hasErrors = Object.values(fieldErrors).some((err) => !!err);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-700 via-cyan-100 to-cyan-200">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 w-full max-w-sm flex flex-col items-center animate-fade-in-up">
        <div className="bg-cyan-50 rounded-full p-4 mb-5 shadow">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#4F8A8B" />
            <path d="M16 32L24 16L32 32H16Z" fill="#fff" />
          </svg>
        </div>
        <h2 className="font-bold text-2xl text-gray-900 mb-1 tracking-wide">
          Welcome Back
        </h2>
        <p className="text-teal-700 text-base mb-6 font-medium">
          Sign in to your investment portfolio
        </p>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4 mb-2"
        >
          {/* Email */}
          <div className="flex flex-col">
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`px-4 py-3 rounded-lg border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition ${fieldErrors.email ? "border-red-500 focus:ring-red-400" : "border-cyan-200 focus:ring-teal-400"}`}
              autoComplete="username"
              required
            />
            {fieldErrors.email && <span className="text-red-500 text-xs mt-1 pl-1 font-medium">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`px-4 py-3 rounded-lg border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition ${fieldErrors.password ? "border-red-500 focus:ring-red-400" : "border-cyan-200 focus:ring-teal-400"}`}
              autoComplete="current-password"
              required
            />
            {fieldErrors.password && <span className="text-red-500 text-xs mt-1 pl-1 font-medium">{fieldErrors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || hasErrors}
            className={`mt-2 py-3 rounded-lg bg-gradient-to-r from-teal-700 to-cyan-300 text-white font-bold text-lg shadow-md transition hover:shadow-lg hover:from-teal-800 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              loading || hasErrors ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="inline-block w-6 h-6 border-2 border-white border-t-teal-700 rounded-full animate-spin align-middle"></span>
            ) : (
              "Login"
            )}
          </button>
        </form>
        {serverError && (
          <p className="text-red-500 mt-2 font-medium text-base text-center">
            {serverError}
          </p>
        )}
      </div>
      <style>
        {`
          .animate-fade-in-up {
            animation: fadeInUp 1s cubic-bezier(.23,1.01,.32,1) both;
          }
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
