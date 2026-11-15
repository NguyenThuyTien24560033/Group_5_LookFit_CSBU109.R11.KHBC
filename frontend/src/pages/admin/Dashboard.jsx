import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "./Dashboard.css";

const INITIAL_STATS = {
  totalUsers: 0,
  totalProducts: 0,
  activeProducts: 0,
  inactiveProducts: 0,
  totalPredefinedOutfits: 0,
  totalUserOutfits: 0,
};

const ICONS = {
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 4 5v1" />
    </>
  ),
  shirt: (
    <path d="m8 3-5 3-1 5 4 2 2-3v11h8V10l2 3 4-2-1-5-5-3-2 3h-4z" />
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  inactive: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 16 8-8" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z" />
      <path d="m19 2 .7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7z" />
    </>
  ),
  heart: (
    <path d="M20.8 8.6c0 4.5-8.8 10.8-8.8 10.8S3.2 13.1 3.2 8.6a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2z" />
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M5.5 9A7.5 7.5 0 0 1 18 6l2 1M4 17l2 1a7.5 7.5 0 0 0 12.5-3" />
    </>
  ),
  trending: (
    <>
      <path d="m3 17 7-7 4 4 7-7" />
      <path d="M16 7h5v5" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function GrowthChart({ data }) {
  const width = 1200;
  const height = 240;
  const maxValue = Math.max(4, ...data);
  const baseline = height;

  const xStep = width / Math.max(1, data.length - 1);
  const points = data.map((value, index) => ({
    x: index * xStep,
    y: baseline - (value / (maxValue || 1)) * (height - 30),
  }));

  const radius = 32;
  let line = points.length ? `M ${points[0].x} ${points[0].y}` : "";

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];

    if (prev.y === current.y) {
      line += ` L ${current.x} ${current.y}`;
    } else {
      const midX = (prev.x + current.x) / 2;
      const dx = Math.min(radius, (current.x - prev.x) / 2);
      line += ` L ${midX - dx} ${prev.y}`;
      line += ` C ${midX} ${prev.y}, ${midX} ${current.y}, ${midX + dx} ${current.y}`;
      line += ` L ${current.x} ${current.y}`;
    }
  }

  const area = `${line} L ${width} ${baseline} L 0 ${baseline} Z`;

  return (
    <div className="lf-growth-chart">
      <div className="lf-chart-y-axis">
        {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map(
          (value, idx) => (
            <span key={idx}>{value}</span>
          )
        )}
      </div>

      <div className="lf-chart-main">
        <svg
          className="lf-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Member growth"
        >
          <defs>
            <linearGradient id="lfChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c24b7c" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#c24b7c" stopOpacity="0" />
            </linearGradient>
          </defs>

          {line && <path d={area} fill="url(#lfChartFill)" />}
          {line && (
            <path
              d={line}
              fill="none"
              stroke="#c24b7c"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="#fff"
              stroke="#c24b7c"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(INITIAL_STATS);
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
      const data = response.data?.data ?? response.data?.stats ?? response.data;
      if (data) {
        setStats({
          totalUsers: Number(data.totalUsers ?? 0),
          totalProducts: Number(data.totalProducts ?? 0),
          activeProducts: Number(data.activeProducts ?? 0),
          inactiveProducts: Number(data.inactiveProducts ?? 0),
          totalPredefinedOutfits: Number(data.totalPredefinedOutfits ?? 0),
          totalUserOutfits: Number(data.totalUserOutfits ?? 0),
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered LookFit accounts in database",
      icon: "users",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      description: "Pieces in the wardrobe catalog",
      icon: "shirt",
    },
    {
      title: "Active Products",
      value: stats.activeProducts,
      description: "Available for styling recommendations",
      icon: "check",
    },
    {
      title: "Inactive Products",
      value: stats.inactiveProducts,
      description: "Hidden from styling",
      icon: "inactive",
    },
    {
      title: "Predefined Outfits",
      value: stats.totalPredefinedOutfits,
      description: "Curated templates by Admin",
      icon: "sparkle",
    },
    {
      title: "User Outfits",
      value: stats.totalUserOutfits,
      description: "Looks created and saved by members",
      icon: "heart",
    },
  ];

  // Tạo dữ liệu biểu đồ dựa trên số lượng user thực tế
  const growthData = [
    Math.max(0, stats.totalUsers - 3),
    Math.max(0, stats.totalUsers - 2),
    Math.max(0, stats.totalUsers - 1),
    stats.totalUsers,
  ];

  return (
    <div className="lf-admin-page">
      <main className="lf-admin-container">
        <div className="lf-admin-intro">
          <p className="lf-admin-kicker">ADMIN CONSOLE</p>
          <h1>Overview</h1>
        </div>

        {error && (
          <p style={{ color: "#ba455a", background: "#fff0f0", padding: "12px 16px", borderRadius: 8, margin: "16px 0" }} role="alert">
            {error}
          </p>
        )}

        {/* STATISTICS */}
        <section className="lf-statistics-section">
          <div className="lf-section-heading">
            <h2>Statistics</h2>

            <button
              type="button"
              className="lf-refresh-button"
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
            >
              <Icon name="refresh" size={19} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="lf-stats-grid">
            {statCards.map((card) => (
              <article className="lf-stat-card" key={card.title}>
                <div className="lf-stat-card-top">
                  <h3>{card.title}</h3>
                  <div className="lf-stat-icon">
                    <Icon name={card.icon} size={20} />
                  </div>
                </div>

                <div className="lf-stat-number">
                  {loading ? "..." : card.value.toLocaleString("en-US")}
                </div>

                <p className="lf-stat-description">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* MEMBER GROWTH */}
        <section className="lf-growth-section">
          <div className="lf-growth-heading">
            <div>
              <h2>Member Overview</h2>
              <p>Registered members in database: <strong>{stats.totalUsers}</strong></p>
            </div>

            <span className="lf-growth-badge">
              <Icon name="trending" size={16} />
              {stats.totalUsers} Total Members
            </span>
          </div>

          <GrowthChart data={growthData} />
        </section>
      </main>

      <button
        type="button"
        className="lf-back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}