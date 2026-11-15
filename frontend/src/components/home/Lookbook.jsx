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
  const [selectedOutfit, setSelectedOutfit] = useState(null);
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
                <article
                  className="look-card"
                  key={outfit._id || index}
                  onClick={() => setSelectedOutfit(outfit)}
                  style={{ cursor: "pointer" }}
                  title="Click to view outfit breakdown"
                >
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

                    {/* Món đồ trong Outfit */}
                    {items.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {items.map((item, itemIdx) => (
                          <button
                            key={item._id || itemIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
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

      {/* ================= MODAL XEM CHI TIẾT TỪNG ITEM TRONG OUTFIT ================= */}
      {selectedOutfit && (
        <div
          className="lookfit-modal-overlay"
          onClick={() => setSelectedOutfit(null)}
        >
          <div
            className="lookfit-save-modal"
            style={{ width: "min(560px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lookfit-modal-close"
              onClick={() => setSelectedOutfit(null)}
              aria-label="Close"
            >
              ×
            </button>

            <p className="lookfit-modal-eyebrow">OUTFIT BREAKDOWN</p>
            <h2>
              {selectedOutfit.name || (selectedOutfit.case ? `${selectedOutfit.case.charAt(0).toUpperCase() + selectedOutfit.case.slice(1)} Look` : "Curated Look")} <em>Pieces</em>
            </h2>

            <p className="lookfit-modal-description" style={{ marginBottom: 18 }}>
              {selectedOutfit.bodyShape && (
                <span>Body shape: <strong style={{ textTransform: "uppercase" }}>{selectedOutfit.bodyShape}</strong> · </span>
              )}
              {selectedOutfit.case && (
                <span>Occasion: <strong style={{ textTransform: "capitalize" }}>{selectedOutfit.case}</strong> · </span>
              )}
              {selectedOutfit.style && (
                <span>Style: <strong style={{ textTransform: "capitalize" }}>{selectedOutfit.style}</strong></span>
              )}
            </p>

            {/* DANH SÁCH CHI TIẾT CÁC MÓN ĐỒ */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: "360px",
                overflowY: "auto",
                marginBottom: 20,
              }}
            >
              {(selectedOutfit.items || []).map((item, idx) => {
                const imgUrl = getItemImageUrl(item);
                const catalogId =
                  item.catalogId?._id ??
                  item.catalogId?.id ??
                  item.catalogId ??
                  item._id ??
                  item.id;

                return (
                  <div
                    key={item._id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #ebd8d4",
                      background: "#fff",
                    }}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.name}
                        style={{
                          width: 58,
                          height: 58,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #eee",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 8,
                          background: "#fbf2f4",
                          display: "grid",
                          placeItems: "center",
                          color: "#b5527a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {item.category?.toUpperCase() || "ITEM"}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#b5527a",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {item.category}{" "}
                        {item.color ? `· ${item.color}` : ""}
                      </span>
                      <h4
                        style={{
                          margin: "3px 0 0",
                          fontSize: 15,
                          color: "#2b2623",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name || "Unnamed Item"}
                      </h4>
                    </div>

                    {catalogId && (
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #b5527a",
                          background: "#fff9fb",
                          color: "#b5527a",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 0.2s ease",
                        }}
                      >
                        View detail →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="lookfit-modal-cancel"
                onClick={() => setSelectedOutfit(null)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "1px solid #ead5cf",
                  background: "#fff",
                  color: "#302a28",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}