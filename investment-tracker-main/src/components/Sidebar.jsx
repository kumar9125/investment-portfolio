import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Portfolios", path: "/portfolios" },
  { name: "Assets", path: "/assets" },
  { name: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden p-3 focus:outline-none fixed top-16 left-4 z-50 bg-white rounded-md shadow"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 h-[calc(100vh-80px)] w-64 bg-white shadow-lg p-6 z-40 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:block`}
      >
        <h1 className="text-2xl font-bold mb-8 text-emerald-700">Menu</h1>
        <nav>
          <ul className="space-y-4">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-3 py-2 rounded-md font-medium transition ${
                      active
                        ? "bg-emerald-100 text-emerald-700 font-semibold"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                    onClick={() => setOpen(false)} // close sidebar on mobile
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
