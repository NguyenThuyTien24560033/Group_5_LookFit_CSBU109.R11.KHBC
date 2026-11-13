import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/dashboard");

      setStats(
        response.data?.data ??
          response.data?.stats ??
          response.data
      );
    } catch (err) {
      setError(
        err.message || "Failed to load dashboard statistics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/dashboard");

        if (!cancelled) {
          setStats(
            response.data?.data ??
              response.data?.stats ??
              response.data
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Failed to load dashboard statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.totalUsers },
    { label: "Total Products", value: stats?.totalProducts },
    { label: "Active Products", value: stats?.activeProducts },
    { label: "Inactive Products", value: stats?.inactiveProducts },
    {
      label: "Predefined Outfits",
      value: stats?.totalPredefinedOutfits,
    },
    {
      label: "User Outfits",
      value: stats?.totalUserOutfits,
    },
  ];

  if (loading) {
    return (
      <section className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-status">
          Loading dashboard statistics...
        </p>
      </section>
    );
  }

  if (error && !stats) {
    return (
      <section className="admin-dashboard">
        <h1>Admin Dashboard</h1>

        <p className="dashboard-error" role="alert">
          {error}
        </p>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={() => fetchStats()}
          disabled={refreshing}
        >
          {refreshing ? "Retrying..." : "Try Again"}
        </button>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-status">
          No dashboard statistics are available.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of the LFit system.</p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      <div
        className="dashboard-cards"
        aria-label="System statistics"
      >
        {cards.map((card) => (
          <article className="dashboard-card" key={card.label}>
            <h2>{card.label}</h2>
            <p>
              {typeof card.value === "number"
                ? card.value.toLocaleString("en-US")
                : card.value ?? 0}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}