import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  return (
    <section className="home-page">
      <div className="home-hero">
        <h1>Welcome to LFit</h1>
        <p>Find your style, one outfit at a time.</p>
      </div>

      <section className="public-outfits">
        <h2>Public Outfits</h2>

        {loading && <p>Loading public outfits...</p>}

        {!loading && errorMessage && (
          <div className="home-error" role="alert">
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => setPage((current) => current)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="pagination-controls">
          <button type="button">
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button type="button">
            Next
          </button>
        </div>
      </section>
    </section>
  );
}