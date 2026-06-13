import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(formData));
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

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
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg border border-cyan-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            autoComplete="username"
            required
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg border border-cyan-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 py-3 rounded-lg bg-gradient-to-r from-teal-700 to-cyan-300 text-white font-bold text-lg shadow-md transition hover:shadow-lg hover:from-teal-800 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="inline-block w-6 h-6 border-2 border-white border-t-teal-700 rounded-full animate-spin align-middle"></span>
            ) : (
              "Login"
            )}
          </button>
        </form>
        {error && (
          <p className="text-red-500 mt-2 font-medium text-base text-center">
            {error}
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
