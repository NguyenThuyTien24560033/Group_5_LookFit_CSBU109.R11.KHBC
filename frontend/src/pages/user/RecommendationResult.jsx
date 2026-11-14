
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getRecommendations } from "../../services/recommendation.service.js";
import { createOutfit } from "../../services/outfit.service.js";
import "./RecommendationResult.css";

// ================= PREVIEW MODE =================
// true: Xem giao diện bằng dữ liệu mẫu, không cần backend
// false: Sử dụng dữ liệu thật từ API
const PREVIEW_MODE = true;

// ================= MOCK DATA =================

const mockRecommendations = [
  {
    name: "The Easy Essential",
    totalScore: 96,
    itemScore: 48,
    colorScore: 48,
    imageUrl:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700",
    items: [
      { name: "Cotton tee", category: "Top" },
      { name: "Straight denim", category: "Bottom" },
      { name: "Casual jacket", category: "Outerwear" },
    ],
  },
  {
    name: "Warm Weekend Edit",
    totalScore: 93,
    itemScore: 46,
    colorScore: 47,
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700",
    items: [
      { name: "Cozy coat", category: "Outerwear" },
      { name: "Classic trousers", category: "Bottom" },
      { name: "Leather bag", category: "Accessories" },
    ],
  },
  {
    name: "Quietly Polished",
    totalScore: 91,
    itemScore: 45,
    colorScore: 46,
    imageUrl:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700",
    items: [
      { name: "Floral dress", category: "Dress" },
      { name: "Elegant accessories", category: "Accessories" },
    ],
  },
  {
    name: "Campus to Coffee",
    totalScore: 88,
    itemScore: 44,
    colorScore: 44,
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=700",
    items: [
      { name: "White shirt", category: "Top" },
      { name: "Denim jeans", category: "Bottom" },
      { name: "Everyday sneakers", category: "Shoes" },
    ],
  },
];

const mockCriteria = {
  case: "casual",
  style: "basic",
  season: "summer",
  weather: "warm",
  lifestyle: "student",
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ================= IMAGE HELPER =================

function getItemImageUrl(item) {
  if (!item) return "";

  if (
    item.imageUrl &&
    typeof item.imageUrl === "string" &&
    item.imageUrl.trim()
  ) {
    return item.imageUrl.trim();
  }

  const id =
    typeof item === "string"
      ? item
      : item.imageId?._id ?? item.imageId?.id ?? item.imageId;

  return id ? `${API_BASE_URL}/images/${id}` : "";
}

// ================= COMPONENT =================

function RecommendationResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
const [showBackToTop, setShowBackToTop] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 250);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
  // Dùng mock data khi Preview Mode bật
  const criteria = PREVIEW_MODE
    ? mockCriteria
    : state?.criteria;

  const initialRecommendations = PREVIEW_MODE
    ? mockRecommendations
    : state?.recommendations ?? [];

  const initialPagination = PREVIEW_MODE
    ? {
        page: 1,
        pageSize: 4,
        totalOutfits: mockRecommendations.length,
        totalPages: 1,
        hasNextPage: false,
      }
    : state?.pagination ?? {
        page: 1,
        pageSize: 4,
        totalOutfits: initialRecommendations.length,
        totalPages: 1,
        hasNextPage: false,
      };

  const [recommendationGroupId] = useState(() =>
    crypto.randomUUID()
  );

  const [recommendations, setRecommendations] = useState(
    initialRecommendations
  );

  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [message, setMessage] = useState("");

  // ================= LOAD RECOMMENDATIONS =================

  const loadRecommendationPage = async (targetPage) => {
    if (loading || savingIndex !== null || !criteria) return;

    if (PREVIEW_MODE) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await getRecommendations(
        criteria,
        targetPage
      );

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
      setMessage(
        error.message ||
          "Unable to load outfits. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= PAGINATION =================

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

  // ================= SAVE OUTFIT =================

  const handleSave = async (outfit, index) => {
    if (PREVIEW_MODE) {
      setMessage(
        "Preview mode: Saving outfits will be available when the backend is connected."
      );
      return;
    }

    if (savingIndex !== null || loading || !criteria) return;

    setSavingIndex(index);
    setMessage("");

    try {
      const items = (outfit.items ?? []).map((item) => ({
        id: item.id ?? item._id,
      }));

      if (
        items.length === 0 ||
        items.some((item) => !item.id)
      ) {
        setMessage(
          "This outfit has invalid item data and cannot be saved."
        );
        return;
      }

      await createOutfit(
        criteria,
        { items },
        recommendationGroupId
      );

      navigate("/outfits/history", {
        replace: true,
        state: {
          message: "Outfit saved successfully.",
        },
      });
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to save outfit. Please try again."
      );
    } finally {
      setSavingIndex(null);
    }
  };

  // ================= MISSING CRITERIA =================

  if (!criteria) {
    return (
      <main className="result-page">
        <div className="result-container">
          <button
            type="button"
            className="result-back"
            onClick={() => navigate("/recommendation")}
          >
            ← Back
          </button>

          <div className="result-empty">
            <p className="result-eyebrow">
              CURATED FOR YOU
            </p>

            <h1>
              Your outfit <em>matches.</em>
            </h1>

            <p>
              Recommendation criteria are missing.
              Please choose your preferences again.
            </p>

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

  // ================= MAIN UI =================

  return (
    <main className="result-page">
      <div className="result-container">

        {/* BACK BUTTON */}
        <button
          type="button"
          className="result-back"
          onClick={() => navigate("/recommendation")}
          disabled={loading || savingIndex !== null}
        >
          ← Back
        </button>

        {/* PAGE HEADER */}
        <header className="result-header">
          <p className="result-eyebrow">
            CURATED FOR YOU
          </p>

          <h1>
            Your outfit <em>matches.</em>
          </h1>

          <div className="result-header-bottom">
            <p>
              Looks selected for your occasion,
              style and lifestyle.
            </p>

            <span className="result-count">
              {pagination.totalOutfits ??
                recommendations.length}{" "}
              recommendations
            </span>
          </div>
        </header>

        {/* MESSAGE */}
        {message && (
          <p className="result-message" role="alert">
            {message}
          </p>
        )}

        {/* LOADING */}
        {loading && (
          <p className="result-loading">
            Finding your perfect looks...
          </p>
        )}

        {/* EMPTY RESULTS */}
        {!loading && recommendations.length === 0 && (
          <div className="result-empty">
            <h2>No outfits found</h2>

            <p>
              Try choosing different preferences.
            </p>

            <button
              type="button"
              className="result-retry"
              onClick={() => navigate("/recommendation")}
            >
              Try Again →
            </button>
          </div>
        )}

        {/* ================= OUTFIT CARDS ================= */}

        {!loading && recommendations.length > 0 && (
          <div className="result-grid">
            {recommendations.map((outfit, index) => {
              const items = outfit.items ?? [];

              // Ưu tiên ảnh mock khi Preview Mode bật
              const coverImage =
                outfit.imageUrl ||
                items.map(getItemImageUrl).find(Boolean);

              const outfitNumber =
                index +
                1 +
                (pagination.page - 1) *
                  (pagination.pageSize || 4);

              const score = Number(outfit.totalScore);

              const displayScore = Number.isFinite(score)
                ? score.toFixed(1)
                : null;

              return (
                <article
                  className="result-card"
                  key={`${pagination.page}-${index}`}
                >

                  {/* IMAGE */}
                  <div className="result-card-image">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={`Recommended outfit ${outfitNumber}`}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="result-image-placeholder">
                        LOOKFIT
                      </div>
                    )}

                    {/* SCORE */}
                    {displayScore !== null && (
                      <span className="result-score">
                        ✓ {displayScore} pts
                      </span>
                    )}

                    {/* SAVE HEART */}
                    <button
                      type="button"
                      className="result-heart"
                      title="Save outfit"
                      aria-label={`Save outfit ${outfitNumber}`}
                      onClick={() =>
                        handleSave(outfit, index)
                      }
                      disabled={
                        loading || savingIndex !== null
                      }
                    >
                      {savingIndex === index ? "…" : "♡"}
                    </button>
                  </div>

                  {/* CARD CONTENT */}
                  <div className="result-card-content">
                    <h2>
                      {outfit.name ||
                        `Your Look ${outfitNumber}`}
                    </h2>

                    <p className="result-card-description">
                      {items.length > 0
                        ? items
                            .map(
                              (item) =>
                                item.name ||
                                item.category ||
                                "Fashion item"
                            )
                            .join(" · ")
                        : "A look curated for your style."}
                    </p>

                    {/* SCORES */}
                    <div className="result-card-scores">
                      {outfit.itemScore != null && (
                        <span>
                          Item score: {outfit.itemScore}
                        </span>
                      )}

                      {outfit.colorScore != null && (
                        <span>
                          Color harmony: {outfit.colorScore}
                        </span>
                      )}
                    </div>

                    {/* FOOTER */}
                    <div className="result-card-footer">
                      <span>
                        {items.length} items
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSave(outfit, index)
                        }
                        disabled={
                          loading || savingIndex !== null
                        }
                      >
                        {savingIndex === index
                          ? "Saving..."
                          : "Save Look"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ================= PAGINATION ================= */}

        <div className="result-pagination">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={
              loading ||
              savingIndex !== null ||
              pagination.page <= 1
            }
          >
            ← Previous
          </button>

          <span>
            Page {pagination.page} of{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              loading ||
              savingIndex !== null ||
              !pagination.hasNextPage
            }
          >
            Next →
          </button>
        </div>

      </div>
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
