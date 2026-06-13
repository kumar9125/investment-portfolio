import { Link } from "react-router-dom";


export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={require("C:\\Users\\jakha\\OneDrive\\Desktop\\Investment Portfolio Tracker\\frontend\\Investment-Portfolio-Tracker\\src\\assets\\project logo.png")}
            alt="Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600"
          />
          <span className="font-bold text-xl text-emerald-700">
            Investment Portfolio Tracker
          </span>
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-emerald-700 font-medium transition"
          >
            Home
          </Link>
          <Link
            to="/signup"
            className="text-gray-700 hover:text-emerald-700 font-medium transition"
          >
            Signup
          </Link>
          <Link
            to="/login"
            className="text-gray-700 hover:text-emerald-700 font-medium transition"
          >
            Login
          </Link>
        </div>
      </div> 
    </nav>
  );
}
