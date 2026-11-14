
import { Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import UserLayout from "./components/layout/Userlayout.jsx";

import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/Login.jsx";
import Register from "./pages/user/Register.jsx";
import Profile from "./pages/user/Profile.jsx";
import CatalogItemDetail from "./pages/user/CatalogItemDetail.jsx";

import Recommendation from "./pages/user/Recommendation.jsx";
import RecommendationResult from "./pages/user/RecommendationResult.jsx";
import OutfitHistory from "./pages/user/OutfitHistory.jsx";
import OutfitEdit from "./pages/user/OutfitEdit.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import PredefinedOutfits from "./pages/admin/PredefinedOutfits.jsx";
import Users from "./pages/admin/Users.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";

import { useAuth } from "./context/AuthContext.jsx";

import "./App.css";

function LandingRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return (
      <Navigate
        to={isAdmin ? "/admin" : "/home"}
        replace
      />
    );
  }

  return <Header />;
}

export default function App() {
  return (
    <main className="app-main">
      <Routes>
        {/* PUBLIC LANDING */}
        <Route path="/" element={<LandingRoute />} />

        {/* LOGIN & REGISTER */}
        <Route element={<UserLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* PUBLIC CATALOG */}
        <Route
          path="/catalog/:id"
          element={<CatalogItemDetail />}
        />

        {/* PROTECTED USER PAGES */}
<Route element={<ProtectedRoute />}>

  {/* Home dashboard */}
  <Route path="/home" element={<Home />} />

  {/* Other pages share the Home navigation */}
  <Route element={<Home showDashboard={false} />}>

    <Route path="/profile" element={<Profile />} />

    <Route
      path="/recommendation"
      element={<Recommendation />}
    />

    <Route
      path="/recommendation/result"
      element={<RecommendationResult />}
    />

    <Route
      path="/outfits/history"
      element={<OutfitHistory />}
    />

    <Route
      path="/outfits/:id/edit"
      element={<OutfitEdit />}
    />

  </Route>

</Route>

        {/* ADMIN PAGES */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Dashboard />} />

          <Route
            path="/admin/predefined-outfits"
            element={<PredefinedOutfits />}
          />

          <Route path="/admin/users" element={<Users />} />
        </Route>

        {/* UNKNOWN ROUTES */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
