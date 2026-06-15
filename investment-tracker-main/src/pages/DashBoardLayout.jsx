import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { fetchUser, logout } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolios } from "../redux/slices/portfolioSlice";

export default function DashBoardLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const userid = user?._id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/portfolios", icon: "📁", label: "Portfolio" },
    { path: "/settings", icon: "⚙️", label: "Settings" },
  ];

  useEffect(() => {
    dispatch(fetchUser());
    if (userid) {
      dispatch(fetchPortfolios(userid));
    }
  }, [dispatch, userid]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 font-sans text-gray-100">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-gray-800 border-b border-gray-700 shadow-md flex justify-between items-center px-4 py-3">
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-lg">
          💹 Tracker
        </span>
        <button
          className="text-gray-300 hover:text-white focus:outline-none"
          onClick={() => setShowSidebar(true)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between md:justify-center px-6 py-6 border-b border-gray-700">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-blue-500 to-teal-400 rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg mb-3">
              💹
            </div>
            <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-xl text-center">
              Investment Tracker
            </h2>
            {user && (
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setShowSidebar(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setShowSidebar(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md font-semibold"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white font-medium"
                }`
              }
            >
              <span className="text-2xl mr-4">{item.icon}</span>
              <span className="text-lg">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition font-semibold"
          >
            <span>🚪</span> Logout
          </button>
          <p className="text-center text-gray-500 text-xs mt-4">
            &copy; {new Date().getFullYear()} Investment Tracker
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0 bg-gray-900">
        <Outlet />
      </main>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
