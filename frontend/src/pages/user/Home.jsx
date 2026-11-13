import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicOutfits } from "../../services/outfit.service.js";
import "./Home.css";

const PAGE_SIZE = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getItemImageUrl(item) {
  if (!item) return null;
  if (item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.trim()) {
    return item.imageUrl.trim();
  }
  const imageId = item.imageId ?? item;
  const id =
    typeof imageId === "object"
      ? imageId._id ?? imageId.id
      : imageId;

  return id ? `${API_BASE_URL}/images/${id}` : null;
}

function getErrorMessage(error) {
  return error?.message || "Unable to load public outfits.";
}

export default function Home() {
  const navigate = useNavigate();

  const [outfits, setOutfits] = useState([]);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalOutfits: 0,
    totalPages: 0,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPublicOutfits() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getPublicOutfits({
          page,
          pageSize: PAGE_SIZE,
        });

        if (cancelled) return;

        const outfitList = Array.isArray(result)
          ? result
          : result?.outfits ?? result?.data?.outfits ?? result?.data ?? [];

        const validOutfits = Array.isArray(outfitList)
          ? outfitList
          : [];

        const paginationData =
          result?.pagination ?? result?.data?.pagination ?? {};

        const totalOutfits =
          paginationData.totalOutfits ??
          paginationData.total ??
          validOutfits.length;

        const totalPages =
          paginationData.totalPages ??
          Math.ceil(totalOutfits / PAGE_SIZE);

        setOutfits(validOutfits);

        setPagination({
          page: paginationData.page ?? page,
          pageSize: paginationData.pageSize ?? PAGE_SIZE,
          totalOutfits,
          totalPages,
          hasNextPage:
            paginationData.hasNextPage ?? page < totalPages,
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
          setOutfits([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPublicOutfits();

    return () => {
      cancelled = true;
    };
  }, [page]);

  function handleItemClick(item) {
    const catalogId =
      item.catalogId?._id ??
      item.catalogId?.id ??
      item.catalogId ??
      item.productId?._id ??
      item.productId?.id ??
      item.productId;

    if (!catalogId) {
      console.warn("Cannot open item detail: catalogId is missing.", item);
      return;
    }

    navigate(`/catalog/${catalogId}`);
  }

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

        {!loading && !errorMessage && outfits.length === 0 && (
          <p>No public outfits available yet.</p>
        )}

        {!loading && !errorMessage && outfits.length > 0 && (
          <>
            <p>Total public outfits: {pagination.totalOutfits}</p>

            <div className="outfit-grid">
              {outfits.map((outfit, outfitIndex) => (
                <article
                  className="public-outfit-card"
                  key={outfit._id ?? outfit.id ?? outfitIndex}
                >
                  <h3>Outfit</h3>

                  <p>
                    Created by: {outfit.user?.name || "Unknown user"}
                  </p>

                  <div className="public-outfit-items">
                    {Array.isArray(outfit.items) &&
                    outfit.items.length > 0 ? (
                      outfit.items.map((item, index) => {
                        const imageUrl = getItemImageUrl(item);

                        return (
                          <div
                            className="public-outfit-item"
                            key={item._id ?? item.id ?? index}
                          >
                            <button
                              type="button"
                              className="catalog-item-link"
                              onClick={() => handleItemClick(item)}
                              title="View product details"
                            >
                              <p>
                                {item.category || "Item"}:{" "}
                                {item.name || "Unnamed item"}
                              </p>

                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.name || "Outfit item"}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <p className="no-image">
                                  No image available
                                </p>
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p>No items in this outfit.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}