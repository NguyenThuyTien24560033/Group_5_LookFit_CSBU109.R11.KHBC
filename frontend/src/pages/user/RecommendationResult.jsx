import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Eye } from "lucide-react";
import { getRecommendations } from "../../services/recommendation.service.js";
import { createOutfit, getOutfitHistory } from "../../services/outfit.service.js";
import "./RecommendationResult.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://group-5-lookfit-csbu109-r11-khbc.onrender.com";
// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

function getItemsSignature(items = []) {
  return items
    .map((item) =>
      String(
        item.catalogId?._id ??
        item.catalogId?.id ??
        item.catalogId ??
        item._id ??
        item.id ??
        item.name ??
        ""
      )
    )
    .filter(Boolean)
    .sort()
    .join("-");
}

function RecommendationResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const criteria = state?.criteria;
  const initialRecommendations = state?.recommendations ?? [];
  const initialPagination = state?.pagination ?? {
    page: 1,
    pageSize: 4,
    totalOutfits: initialRecommendations.length,
    totalPages: 1,
    hasNextPage: false,
  };

  const [recommendationGroupId] = useState(() => crypto.randomUUID());
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Modal xem chi tiết outfit
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  // Tải danh sách outfit đã lưu từ database để hiển thị trạng thái tim hồng
  useEffect(() => {
    let cancelled = false;

    async function loadSavedHistory() {
      try {
        const res = await getOutfitHistory();
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.outfits ?? [];
        setSavedOutfits(list);
      } catch {
        // bỏ qua nếu chưa có
      }
    }

    loadSavedHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= PHÂN TRANG GỌI API THẬT =================

  const loadRecommendationPage = async (targetPage) => {
    if (loading || savingIndex !== null || !criteria) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await getRecommendations(criteria, targetPage);
      setRecommendations(result.recommendations ?? []);
      setPagination(
        result.pagination ?? {
          page: targetPage,
          pageSize: 4,
          totalOutfits: 0,
          totalPages: 1,
          hasNextPage: false,
        }
      );
    } catch (error) {
      setMessage(error.message || "Unable to load outfits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (pagination.hasNextPage) {
      loadRecommendationPage(pagination.page + 1);
    }
  };

  const handlePrevious = () => {
    if (pagination.page > 1) {
      loadRecommendationPage(pagination.page - 1);
    }
  };

  // ================= LƯU OUTFIT VÀO DATABASE THẬT =================

  const handleSaveOutfit = async (outfit, index) => {
    if (!outfit || loading || savingIndex !== null || !criteria) return;

    setSavingIndex(index);
    setMessage("");

    try {
      const currentSignature = getItemsSignature(outfit.items);
      const alreadySaved = savedOutfits.some(
        (saved) => getItemsSignature(saved.items) === currentSignature
      );

      if (alreadySaved) {
        setMessage("Outfit is already in your History.");
        return;
      }

      const items = (outfit.items ?? []).map((item) => ({
        id: String(
          item.catalogId?._id ??
          item.catalogId?.id ??
          item.catalogId ??
          item._id ??
          item.id
        ),
      }));

      if (items.length === 0 || items.some((item) => !item.id)) {
        setMessage("Invalid outfit items.");
        return;
      }

      const res = await createOutfit(criteria, { items }, recommendationGroupId);
      const created = res?.outfit ?? res;

      setSavedOutfits((prev) => [created, ...prev]);
      setMessage("Outfit saved to your History as Draft!");
    } catch (error) {
      setMessage(error.message || "Failed to save outfit.");
    } finally {
      setSavingIndex(null);
    }
  };

  function handleOpenItemDetail(item, event) {
    if (event) event.stopPropagation();
    const catalogId =
      item.catalogId?._id ??
      item.catalogId?.id ??
      item.catalogId ??
      item._id ??
      item.id;

    if (catalogId) {
      navigate(`/catalog/${catalogId}`);
    }
  }

  // Nếu người dùng truy cập trực tiếp URL mà chưa chọn tiêu chí
  if (!criteria) {
    return (
      <main className="result-page">
        <div className="result-container">
          <button
            type="button"
            className="result-back lookfit-page-back"
            onClick={() => navigate("/recommendation")}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <div className="result-empty">
            <p className="result-eyebrow">CURATED FOR YOU</p>
            <h1>Your outfit <em>matches.</em></h1>
            <p>Recommendation criteria are missing. Please choose your preferences first.</p>
            <button
              type="button"
              className="result-retry"
              onClick={() => navigate("/recommendation")}
            >
              Choose Preferences →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="result-page">
      <div className="result-container">
        {/* BACK BUTTON */}
        <button
          type="button"
          className="result-back lookfit-page-back"
          onClick={() => navigate("/recommendation")}
          disabled={loading || savingIndex !== null}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* HEADER */}
        <header className="result-header">
          <p className="result-eyebrow">CURATED FOR YOU</p>
          <h1>Your outfit <em>matches.</em></h1>
          <div className="result-header-bottom">
            <p>Looks selected for your occasion, style and lifestyle.</p>
            <span className="result-count">
              {pagination.totalOutfits ?? recommendations.length} recommendations
            </span>
          </div>
        </header>

        {message && (
          <p className="result-message" role="alert">{message}</p>
        )}

        {loading && (
          <p className="result-loading">Finding your perfect looks from database...</p>
        )}

        {/* EMPTY */}
        {!loading && recommendations.length === 0 && (
          <div className="result-empty">
            <h2>No outfits found</h2>
            <p>Try choosing different preferences (occasion, style or weather).</p>
            <button
              type="button"
              className="result-retry"
              onClick={() => navigate("/recommendation")}
            >
              Try Again →
            </button>
          </div>
        )}

        {/* OUTFIT CARDS */}
        {!loading && recommendations.length > 0 && (
          <div className="result-grid">
            {recommendations.map((outfit, index) => {
              const items = outfit.items ?? [];
              const currentSignature = getItemsSignature(items);
              const isSaved = savedOutfits.some(
                (saved) => getItemsSignature(saved.items) === currentSignature
              );

              const coverImage =
                outfit.imageUrl ||
                items.map(getItemImageUrl).find(Boolean);

              const outfitNumber =
                index + 1 + (pagination.page - 1) * (pagination.pageSize || 4);

              const score = Number(outfit.totalScore);
              const displayScore = Number.isFinite(score) ? score.toFixed(1) : null;

              return (
                <article
                  className="result-card"
                  key={`${pagination.page}-${index}`}
                >
                  {/* IMAGE - BẤM VÀO ĐỂ XEM CHI TIẾT CÁC MÓN ĐỒ */}
                  <div
                    className="result-card-image"
                    onClick={() => setSelectedOutfit(outfit)}
                    style={{ cursor: "pointer" }}
                    title="Click to view all items in this look"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={outfit.name || `Recommended outfit ${outfitNumber}`}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="result-image-placeholder">LOOKFIT</div>
                    )}

                    {displayScore !== null && (
                      <span className="result-score">
                        ✓ {displayScore} pts
                      </span>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        padding: "6px 10px",
                        background: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(4px)",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#b5527a",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Eye size={13} /> View items
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="result-card-content">
                    <h2
                      onClick={() => setSelectedOutfit(outfit)}
                      style={{ cursor: "pointer" }}
                      title="Click to view details"
                    >
                      {outfit.name || `Look #${outfitNumber}`}
                    </h2>

                    {/* HIỂN THỊ CÁC MÓN ĐỒ VỚI NÚT BẤM XEM TỪNG MÓN */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
                      {items.map((item, itemIdx) => (
                        <button
                          key={item._id || itemIdx}
                          type="button"
                          onClick={(e) => handleOpenItemDetail(item, e)}
                          title={`Click to view product detail: ${item.name}`}
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #ead5cf",
                            background: "#fff",
                            color: "#46332e",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#b5527a", textTransform: "capitalize" }}>
                            {item.category}:
                          </span>{" "}
                          {item.name || "Item"}
                        </button>
                      ))}
                    </div>

                    {/* SCORES TỪ THUẬT TOÁN BACKEND */}
                    <div className="result-card-scores">
                      {outfit.itemScore != null && (
                        <span>Item score: {Number(outfit.itemScore).toFixed(1)}</span>
                      )}
                      {outfit.colorScore != null && (
                        <span>Color harmony: {Number(outfit.colorScore).toFixed(1)}</span>
                      )}
                    </div>

                    {/* FOOTER */}
                    <div className="result-card-footer">
                      <span
                        onClick={() => setSelectedOutfit(outfit)}
                        style={{ cursor: "pointer", textDecoration: "underline", color: "#8a756f" }}
                      >
                        {items.length} items (inspect)
                      </span>

                      <button
                        type="button"
                        className={`result-save-heart${isSaved ? " is-saved" : ""}`}
                        onClick={() => handleSaveOutfit(outfit, index)}
                        disabled={loading || savingIndex !== null}
                        aria-label={isSaved ? "Saved to History" : "Save to History"}
                        aria-pressed={isSaved}
                        title={isSaved ? "Saved in History" : "Save to History"}
                        style={{
                          width: 44,
                          height: 40,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 10,
                          border: "1px solid #e8cbd8",
                          background: isSaved ? "#fbe6ef" : "#fff9fb",
                          color: "#b4507e",
                          cursor: "pointer",
                          transition: "background .2s ease, transform .2s ease",
                        }}
                      >
                        <Heart
                          size={22}
                          fill={isSaved ? "currentColor" : "none"}
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="result-pagination">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={loading || savingIndex !== null || pagination.page <= 1}
            >
              ← Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                loading || savingIndex !== null || !pagination.hasNextPage
              }
            >
              Next →
            </button>
          </div>
        )}
      </div>

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
              {selectedOutfit.name || "Curated Look"} <em>Pieces</em>
            </h2>

            <p className="lookfit-modal-description" style={{ marginBottom: 18 }}>
              Total match score:{" "}
              <strong>{Number(selectedOutfit.totalScore).toFixed(1)} pts</strong>{" "}
              (Item score: {Number(selectedOutfit.itemScore).toFixed(1)} · Color harmony:{" "}
              {Number(selectedOutfit.colorScore).toFixed(1)})
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
                        onClick={(e) => handleOpenItemDetail(item, e)}
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

            <div className="lookfit-modal-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="lookfit-modal-cancel"
                onClick={() => setSelectedOutfit(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACK TO TOP */}
      {showBackToTop && (
        <button
          type="button"
          className="recommendation-back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      )}
    </main>
  );
}

export default RecommendationResult;