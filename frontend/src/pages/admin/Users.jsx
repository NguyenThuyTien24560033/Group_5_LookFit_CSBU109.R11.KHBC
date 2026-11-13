import { useEffect, useState } from "react";
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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const data = response.data;

        setUsers(Array.isArray(data.data) ? data.data : []);

        setPagination({
          ...INITIAL_PAGINATION,
          ...(data.pagination ?? {}),
          page: data.pagination?.page ?? page,
          pageSize: PAGE_SIZE,
        });
      } catch (err) {
        if (!cancelled) {
          setUsers([]);
          setError(
            err.message || "Không thể tải danh sách người dùng."
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

  function formatDate(value) {
    if (!value) return "Chưa có thông tin";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Chưa có thông tin";
    }

    return date.toLocaleDateString("vi-VN");
  }

return (
  <main className="admin-users-page">
    <header className="admin-users-header">
      <div>
        <h1>User Management</h1>
        <p>Manage and search LFit user accounts.</p>
      </div>

      <div className="admin-users-total">
        <span>Total Matching Users</span>
        <strong>{pagination.totalUsers}</strong>
      </div>
    </header>

    <form className="admin-users-search" onSubmit={handleSearch}>
      <div className="admin-users-search-field">
        <label htmlFor="user-search">Name or Email</label>
        <input
          id="user-search"
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Enter name or email..."
        />
      </div>

      <button
        type="submit"
        className="admin-users-button admin-users-button--primary"
        disabled={loading}
      >
        Search
      </button>

      <button
        type="button"
        className="admin-users-button"
        onClick={handleClearSearch}
        disabled={loading && !search && !searchInput}
      >
        Clear Search
      </button>
    </form>

    {error && (
      <p className="admin-users-error" role="alert">
        {error}
      </p>
    )}

    {loading ? (
      <div className="admin-users-state">
        Loading users...
      </div>
    ) : users.length === 0 ? (
      <div className="admin-users-state">
        No matching users found.
      </div>
    ) : (
      <>
        <div className="admin-users-list">
          {users.map((user, index) => (
            <article
              className="admin-user-card"
              key={user._id ?? user.id ?? user.email ?? index}
            >
              <div className="admin-user-card-header">
                <div className="admin-user-avatar" aria-hidden="true">
                  {(user.name || user.email || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="admin-user-heading">
                  <h2>{user.name || "No Name"}</h2>
                  <p>{user.email || "No Email"}</p>
                </div>

                <span
                  className={`admin-user-role ${
                    user.role === "ADMIN"
                      ? "admin-user-role--admin"
                      : ""
                  }`}
                >
                  {user.role || "USER"}
                </span>
              </div>

              <div className="admin-user-details">
                <p>
                  <span>Registration Date</span>
                  <strong>{formatDate(user.createdAt)}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>

        <nav
          className="admin-users-pagination"
          aria-label="User pagination"
        >
          <button
            type="button"
            className="admin-users-button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} / {Math.max(1, pagination.totalPages)}
          </span>

          <button
            type="button"
            className="admin-users-button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      </>
    )}
  </main>
);
}