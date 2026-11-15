import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { getPublicOutfits } from "../../services/outfit.service.js";
import "./Lookbook.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getItemImageUrl(item) {
  if (!item) return "";
  if (typeof item.imageUrl === "string" && item.imageUrl.trim()) {
    return item.imageUrl.trim();
  }
  const id =
    typeof item === "string"
      ? item
      : item.imageId?._id ?? item.imageId?.id ?? item.imageId;

  return id ? `${API_BASE_URL}/images/${id}` : "";
}

export default function Lookbook() {
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    totalOutfits: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchPublicLooks() {
      setLoading(true);
      setError("");

      try {
        const result = await getPublicOutfits({ page, pageSize: 6 });
        if (cancelled) return;

        const outfitList = Array.isArray(result)
          ? result
          : result?.outfits ?? result?.data?.outfits ?? result?.data ?? [];

        const paginationData = result?.pagination ?? {};
        const totalOutfits =
          paginationData.totalOutfits ?? outfitList.length;
        const totalPages =
          paginationData.totalPages ?? Math.max(1, Math.ceil(totalOutfits / 6));

        setOutfits(outfitList);
        setPagination({
          page: paginationData.page ?? page,
          pageSize: paginationData.pageSize ?? 6,
          totalOutfits,
          totalPages,
          hasNextPage:
            paginationData.hasNextPage ?? page < totalPages,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load community looks.");
          setOutfits([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPublicLooks();
    return () => {
      cancelled = true;
    };
  }, [page]);

  function handleItemClick(item) {
    const catalogId =
      item?.catalogId?._id ??
      item?.catalogId?.id ??
      item?.catalogId ??
      item?._id ??
      item?.id;

    if (catalogId) {
      navigate(`/catalog/${catalogId}`);
    }
  }

  return (
    <section id="feed" className="feed-section container">
      <div className="section-heading feed-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            FROM THE COMMUNITY
          </span>
          <h2>
            Community <em>Outfits.</em>
          </h2>
        </div>

        {pagination.totalOutfits > 0 && (
          <span className="text-link" style={{ borderBottom: "none" }}>
            {pagination.totalOutfits} Public Looks
          </span>
        )}
      </div>

      {loading && (
        <p style={{ textAlign: "center", color: "#a58d85", padding: "40px 0" }}>
          Loading community outfits from LookFit...
        </p>
      )}

      {error && !loading && (
        <p style={{ textAlign: "center", color: "#b5527a", padding: "30px 0" }}>
          {error}
        </p>
      )}

      {!loading && !error && outfits.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#8a756f" }}>
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            No community outfits published yet.
          </p>
          <p style={{ fontSize: "13px", color: "#a58d85" }}>
            Log in, create an outfit, and choose &ldquo;Publish to community&rdquo; to showcase your look here!
          </p>
        </div>
      )}

      {!loading && outfits.length > 0 && (
        <>
          <div className="look-grid">
            {outfits.map((outfit, index) => {
              const author =
                outfit.user?.name || outfit.userId?.name || "LookFit Member";
              const items = Array.isArray(outfit.items) ? outfit.items : [];
              const firstImage = items.map(getItemImageUrl).find(Boolean) || "";

              return (
                <article className="look-card" key={outfit._id || index}>
                  <div
                    className="look-image"
                    style={{
                      background: firstImage
                        ? `url("${firstImage}") center/cover no-repeat`
                        : "#f3e0d3",
                      minHeight: 250,
                      position: "relative",
                    }}
                  >
                    <div className="look-score">
                      {outfit.bodyShape ? outfit.bodyShape.toUpperCase() : "FINAL"}
                    </div>
                  </div>

                  <div className="look-meta" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h4 style={{ margin: 0 }}>
                        {outfit.case ? `${outfit.case.charAt(0).toUpperCase() + outfit.case.slice(1)} Look` : `Look #${index + 1}`}
                      </h4>
                      <span style={{ fontSize: 11, color: "#b5527a", textTransform: "capitalize" }}>
                        {outfit.style || "Curated"}
                      </span>
                    </div>

                    <p style={{ margin: 0 }}>Curated by {author}</p>

                    {/* Món đồ trong Outfit - bấm vào xem chi tiết sản phẩm */}
                    {items.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {items.map((item, itemIdx) => (
                          <button
                            key={item._id || itemIdx}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            title={`View details of ${item.name}`}
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 4,
                              border: "1px solid #e7d5cf",
                              background: "#fff",
                              color: "#2b2623",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {item.name || item.category || "Item"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                marginTop: 40,
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #b5527a",
                  borderRadius: 6,
                  background: page <= 1 ? "#eee" : "#fff",
                  color: page <= 1 ? "#999" : "#b5527a",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ArrowLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: 13, color: "#666" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #b5527a",
                  borderRadius: 6,
                  background: !pagination.hasNextPage ? "#eee" : "#fff",
                  color: !pagination.hasNextPage ? "#999" : "#b5527a",
                  cursor: !pagination.hasNextPage ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}