import { Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/Login.jsx";
import Register from "./pages/user/Register.jsx";
import Profile from "./pages/user/Profile.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import Users from "./pages/admin/Users.jsx";
import PredefinedOutfits from "./pages/admin/PredefinedOutfits.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";

import "./App.css";

export default function App() {
  return (
    <>
      <Header />

      <main className="app-main">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
            <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route
              path="/admin/predefined-outfits"
              element={<PredefinedOutfits />}
            />
            <Route
              path="/admin/users"
              element={<Users />}
            />
          </Route>

          {/* Redirect unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}