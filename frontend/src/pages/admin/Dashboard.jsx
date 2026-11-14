
import { useState } from "react";
import "./Dashboard.css";

// Frontend demo data
const MOCK_STATS = {
  totalUsers: 2,
  totalProducts: 12,
  activeProducts: 10,
  inactiveProducts: 2,
  totalPredefinedOutfits: 3,
  totalUserOutfits: 2,
};

const MOCK_GROWTH = [
  0, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 2, 2, 2,
];

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
  const maxValue = 4;
  const baseline = height;

  const xStep = width / (data.length - 1);

  const points = data.map((value, index) => ({
    x: index * xStep,
    y: baseline - (value / maxValue) * height,
  }));

  const radius = 32;

  let line = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];

    if (prev.y === current.y) {
      line += ` L ${current.x} ${current.y}`;
    } else {
      const midX = (prev.x + current.x) / 2;

      const dx = Math.min(
        radius,
        (current.x - prev.x) / 2
      );

      line += ` L ${midX - dx} ${prev.y}`;
      line += ` C ${midX} ${prev.y}, ${midX} ${current.y}, ${midX + dx} ${current.y}`;
      line += ` L ${current.x} ${current.y}`;
    }
  }

  const area =
    `${line} L ${width} ${baseline} L 0 ${baseline} Z`;

  return (
    <div className="lf-growth-chart">
      <div className="lf-chart-y-axis">
        {[4, 3, 2, 1, 0].map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div className="lf-chart-main">
        <svg
          className="lf-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Member growth over 14 days"
        >
          <defs>
            <linearGradient
              id="lfChartFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#c24b7c"
                stopOpacity="0.17"
              />

              <stop
                offset="100%"
                stopColor="#c24b7c"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((value) => (
            <line
              key={value}
              x1="0"
              y1={
                baseline -
                (value / maxValue) * height
              }
              x2={width}
              y2={
                baseline -
                (value / maxValue) * height
              }
              stroke="#eadfdc"
              strokeDasharray="4 5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path
            d={area}
            fill="url(#lfChartFill)"
          />

          <path
            d={line}
            fill="none"
            stroke="#c24b7c"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="lf-chart-x-axis">
          {data.map((_, index) => (
            <span key={index}>
              Nov {index + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [growth, setGrowth] = useState(MOCK_GROWTH);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);

    setStats({ ...MOCK_STATS });
    setGrowth([...MOCK_GROWTH]);

    setRefreshing(false);
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered LookFit accounts",
      icon: "users",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      description: "Pieces in the wardrobe catalog",
      icon: "shirt",
    },
    {
      title: "Active",
      value: stats.activeProducts,
      description: "Products available for styling",
      icon: "check",
    },
    {
      title: "Inactive",
      value: stats.inactiveProducts,
      description: "Hidden from styling",
      icon: "inactive",
    },
    {
      title: "Predefined Outfits",
      value: stats.totalPredefinedOutfits,
      description: "Curated looks by LookFit",
      icon: "sparkle",
    },
    {
      title: "User Outfits",
      value: stats.totalUserOutfits,
      description: "Looks saved by members",
      icon: "heart",
    },
  ];

  return (
    <div className="lf-admin-page">
      {/* ========== MAIN ========== */}

      <main className="lf-admin-container">

        {/* INTRO */}
        <div className="lf-admin-intro">
          <p className="lf-admin-kicker">
            ADMIN CONSOLE
          </p>

          <h1>Overview</h1>
        </div>

        {/* STATISTICS */}
        <section className="lf-statistics-section">
          <div className="lf-section-heading">
            <h2>Statistics</h2>

            <button
              type="button"
              className="lf-refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <Icon
                name="refresh"
                size={19}
              />
              Refresh
            </button>
          </div>

          <div className="lf-stats-grid">
            {statCards.map((card) => (
              <article
                className="lf-stat-card"
                key={card.title}
              >
                <div className="lf-stat-card-top">
                  <h3>{card.title}</h3>

                  <div className="lf-stat-icon">
                    <Icon
                      name={card.icon}
                      size={20}
                    />
                  </div>
                </div>

                <div className="lf-stat-number">
                  {card.value.toLocaleString("en-US")}
                </div>

                <p className="lf-stat-description">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* MEMBER GROWTH */}
        <section className="lf-growth-section">
          <div className="lf-growth-heading">
            <div>
              <h2>Member growth</h2>

              <p>
                Total registered members over
                the last 14 days
              </p>
            </div>

            <span className="lf-growth-badge">
              <Icon
                name="trending"
                size={16}
              />
              +2 in 14 days
            </span>
          </div>

          <GrowthChart data={growth} />
        </section>
      </main>

      {/* BACK TO TOP */}
      <button
        type="button"
        className="lf-back-to-top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
