
import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  UserRoundPlus,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";
import api from "../../services/api.js";
import "./Users.css";

const PAGE_SIZE = 10;

const INITIAL_PAGINATION = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalUsers: 0,
  totalPages: 0,
  hasNextPage: false,
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // BACK TO TOP
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // LOAD USERS
  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/users", {
          params: {
            search,
            page,
            pageSize: PAGE_SIZE,
          },
        });

        if (cancelled) return;

        const result = response.data ?? {};
        const records = Array.isArray(result.data)
          ? result.data
          : [];

        setUsers(records);

        setPagination({
          ...INITIAL_PAGINATION,
          ...(result.pagination ?? {}),
          page: result.pagination?.page ?? page,
          pageSize: PAGE_SIZE,
          totalUsers:
            result.pagination?.totalUsers ?? records.length,
        });
      } catch (err) {
        if (!cancelled) {
          setUsers([]);
          setPagination(INITIAL_PAGINATION);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load members."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [search, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const visibleStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    return {
      admins: users.filter(
        (user) => user.role?.toUpperCase() === "ADMIN"
      ).length,

      newThisWeek: users.filter((user) => {
        if (!user.createdAt) return false;

        const date = new Date(user.createdAt);

        return (
          !Number.isNaN(date.getTime()) &&
          date >= weekAgo &&
          date <= now
        );
      }).length,
    };
  }, [users]);

  const stats = [
    {
      label: "Members",
      value: pagination.totalUsers,
      description: "Registered LookFit accounts",
      icon: UsersRound,
    },
    {
      label: "New this week",
      value: visibleStats.newThisWeek,
      description: "Joined in the last 7 days",
      icon: UserRoundPlus,
    },
    {
      label: "Admins",
      value: visibleStats.admins,
      description: "Accounts with admin access",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="lf-members-page">
      <main className="lf-members-container">
        {/* INTRO */}
        <div className="lf-members-intro">
          <p className="lf-members-kicker">COMMUNITY</p>
          <h1>Members.</h1>
          <p>The people styling their looks with LookFit.</p>
        </div>

        {/* STATISTICS */}
        <section className="lf-members-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                className="lf-members-stat-card"
                key={stat.label}
              >
                <div className="lf-members-stat-top">
                  <h2>{stat.label}</h2>

                  <span className="lf-members-stat-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                </div>

                <strong>{stat.value}</strong>
                <p>{stat.description}</p>
              </article>
            );
          })}
        </section>

        {/* MEMBERS TABLE */}
        <section className="lf-members-table-section">
          <div className="lf-members-table-heading">
            <h2>All members</h2>
            <span>{pagination.totalUsers} accounts</span>
          </div>

          {/* SEARCH */}
          <form
            className="lf-members-search"
            onSubmit={handleSearch}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by name or email..."
              aria-label="Search members"
            />

            <button type="submit" disabled={loading}>
              Search
            </button>

            <button
              type="button"
              className="lf-members-reset"
              onClick={handleClearSearch}
            >
              Reset
            </button>
          </form>

          {/* ERROR */}
          {error && (
            <p className="lf-members-error" role="alert">
              {error}
            </p>
          )}

          {/* TABLE */}
          <div className="lf-members-table-scroll">
            <table className="lf-members-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>JOINED DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="lf-members-empty"
                    >
                      Loading members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="lf-members-empty"
                    >
                      {error
                        ? "Unable to display members."
                        : "No matching users found."}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => {
                    const isAdmin =
                      user.role?.toUpperCase() === "ADMIN";

                    const isActive =
                      user.isActive !== false &&
                      user.status?.toUpperCase() !== "INACTIVE";

                    return (
                      <tr
                        key={
                          user._id ??
                          user.id ??
                          user.email ??
                          index
                        }
                      >
                        <td>
                          <div className="lf-members-user">
                            <span className="lf-members-avatar">
                              {getInitials(
                                user.name || user.email
                              )}
                            </span>

                            <div>
                              <strong>
                                {user.name || "Unnamed User"}
                              </strong>
                              <p>
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`lf-members-role ${
                              isAdmin
                                ? "lf-members-role-admin"
                                : ""
                            }`}
                          >
                            {isAdmin ? "Admin" : "Member"}
                          </span>
                        </td>

                        <td>
                          {formatDate(user.createdAt)}
                        </td>

                        <td>
                          <span
                            className={`lf-members-status ${
                              !isActive
                                ? "lf-members-status-inactive"
                                : ""
                            }`}
                          >
                            <span className="lf-members-status-dot" />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="lf-members-pagination">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() =>
                  setPage((current) => current - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage || loading
                }
                onClick={() =>
                  setPage((current) => current + 1)
                }
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>

      {/* BACK TO TOP */}
      {showBackToTop && (
        <button
          type="button"
          className="lf-members-back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp size={24} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
