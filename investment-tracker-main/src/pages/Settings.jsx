import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUser, logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(fetchUser());
    }
  }, [dispatch, user]);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "⚠️ WARNING: Are you sure you want to permanently delete your account? This will erase all your portfolios, holdings, transaction ledgers, and watchlists. This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        setDeleting(true);
        const res = await axiosInstance.delete("/auth/me");
        alert(res.data.message || "Account deleted successfully.");
        dispatch(logout());
        navigate("/signup");
      } catch (err) {
        alert(err.response?.data?.message || err.message || "Failed to delete account");
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 mb-8">
          Settings & Profile
        </h1>

        <div className="space-y-6">
          {/* Profile Details Card */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">User Profile</h2>
            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-1">Full Name</label>
                  <p className="text-lg font-medium text-white bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">{user.name}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-1">Email Address</label>
                  <p className="text-lg font-medium text-white bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading user profile information...</div>
            )}
          </div>

          {/* Danger Zone Card */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-red-500/20 shadow-xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-gray-400 text-sm mb-6">
              Deleting your account is permanent. All your investment strategies, transaction timeline ledgers, and watch lists will be erased instantly.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className={`bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 ${deleting ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {deleting ? "Deleting Account..." : "🗑️ Delete My Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
