import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import Portfolios from "./pages/Portfolios";
import Settings from "./pages/Settings";
import DashBoardLayout from "./pages/DashBoardLayout";

function App() {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />


        {/* Protected Dashboard Layout with Nested Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashBoardLayout />
            </ProtectedRoute>
          }
        >

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
  );
}

export default App;
