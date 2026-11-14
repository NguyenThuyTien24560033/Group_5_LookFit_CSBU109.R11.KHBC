
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { getRecommendations } from "../../services/recommendation.service.js";
import { createOutfit } from "../../services/outfit.service.js";
import "./RecommendationResult.css";

// true = dữ liệu demo, chưa cần backend
// false = sử dụng API thật
const PREVIEW_MODE = true;

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

function getItemImageUrl(item) {
  if (!item) return "";

  if (
    typeof item.imageUrl === "string" &&
    item.imageUrl.trim()
  ) {
    return item.imageUrl.trim();
  }

  const id =
    typeof item === "string"
      ? item
      : item.imageId?._id ??
        item.imageId?.id ??
        item.imageId;

  return id ? `${API_BASE_URL}/images/${id}` : "";
}

const STORAGE_KEY = "lookfit_preview_outfits";

function readSavedOutfits() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function outfitSignature(outfit, criteria) {
  return JSON.stringify({
    name: outfit?.name || "",
    items: (outfit?.items || []).map((item) => ({
      name: item?.name || "",
      category: item?.category || "",
      id: item?.id || item?._id || "",
    })),
    criteria: criteria || {},
  });
}

function RecommendationResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const criteria = PREVIEW_MODE
    ? state?.criteria ?? mockCriteria
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

  const [recommendationGroupId] = useState(
    () => crypto.randomUUID()
  );

  const [recommendations, setRecommendations] = useState(
    initialRecommendations
  );

  const [pagination, setPagination] = useState(
    initialPagination
  );

  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [savedOutfits, setSavedOutfits] = useState(readSavedOutfits);

  // Back to top
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

  // ================= PAGINATION =================

  const loadRecommendationPage = async (targetPage) => {
    if (loading || savingIndex !== null || !criteria) {
      return;
    }

    if (PREVIEW_MODE) return;

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

  // ================= SAVE OUTFIT DIRECTLY TO HISTORY =================

  const handleSaveOutfit = async (outfit, index) => {
    if (!outfit || loading || savingIndex !== null) return;

    setSavingIndex(index);
    try {
      if (PREVIEW_MODE) {
        const existing = readSavedOutfits();
        const signature = outfitSignature(outfit, criteria);
        const alreadySaved = existing.some(
          (item) => item.saveSignature === signature ||
            outfitSignature(item, item.criteria) === signature
        );

        const updated = alreadySaved
          ? existing.filter(
              (item) => item.saveSignature !== signature &&
                outfitSignature(item, item.criteria) !== signature
            )
          : [
              {
                id: crypto.randomUUID(),
                recommendationGroupId,
                saveSignature: signature,
                name: outfit.name || "My Outfit",
                imageUrl: outfit.imageUrl ||
                  (outfit.items ?? []).map(getItemImageUrl).find(Boolean) || "",
                items: outfit.items ?? [],
                itemScore: outfit.itemScore,
                colorScore: outfit.colorScore,
                totalScore: outfit.totalScore,
                criteria,
                status: "DRAFT",
                visibility: "private",
                createdAt: new Date().toISOString(),
              },
              ...existing,
            ];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedOutfits(updated);
      } else {
        const items = (outfit.items ?? []).map((item) => ({
          id: item.id ?? item._id,
        }));
        if (items.length === 0 || items.some((item) => !item.id)) return;
        await createOutfit(criteria, { items }, recommendationGroupId);
        setSavedOutfits((previous) => [
          { ...outfit, criteria, saveSignature: outfitSignature(outfit, criteria) },
          ...previous,
        ]);
      }
    } catch (error) {
      console.error("Unable to update saved outfit:", error);
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
            className="result-back lookfit-page-back"
            onClick={() => navigate("/recommendation")}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
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
        {/* BACK */}
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

        {/* No save notification: the pink heart indicates saved state. */}
        {message && !PREVIEW_MODE && (
          <p className="result-message" role="alert">{message}</p>
        )}

        {loading && (
          <p className="result-loading">
            Finding your perfect looks...
          </p>
        )}

        {/* EMPTY */}
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

        {/* OUTFIT CARDS */}
        {!loading && recommendations.length > 0 && (
          <div className="result-grid">
            {recommendations.map((outfit, index) => {
              const items = outfit.items ?? [];
              const signature = outfitSignature(outfit, criteria);
              const isSaved = savedOutfits.some(
                (item) => item.saveSignature === signature ||
                  outfitSignature(item, item.criteria) === signature
              );

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
                        alt={
                          outfit.name ||
                          `Recommended outfit ${outfitNumber}`
                        }
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

                    {displayScore !== null && (
                      <span className="result-score">
                        ✓ {displayScore} pts
                      </span>
                    )}

                  </div>

                  {/* CONTENT */}
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
                      <span>{items.length} items</span>

                      <button
                        type="button"
                        className={`result-save-heart${isSaved ? " is-saved" : ""}`}
                        onClick={() => handleSaveOutfit(outfit, index)}
                        disabled={loading || savingIndex !== null}
                        aria-label={isSaved ? `Remove ${outfit.name} from History` : `Save ${outfit.name} to History`}
                        aria-pressed={isSaved}
                        title={isSaved ? "Saved — click to remove" : "Save to History"}
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
                        <Heart size={22} fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
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
