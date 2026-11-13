import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getRecommendations } from "../../services/recommendation.service.js";
import { createOutfit } from "../../services/outfit.service.js";
import "./RecommendationResult.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getItemImageUrl(item) {
  if (!item) return "";
  if (item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.trim()) {
    return item.imageUrl.trim();
  }
  const id =
    typeof item === "string"
      ? item
      : item.imageId?._id ?? item.imageId?.id ?? item.imageId;
  return id ? `${API_BASE_URL}/images/${id}` : "";
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

  const [recommendations, setRecommendations] = useState(
    initialRecommendations
  );

  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [message, setMessage] = useState("");

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
      setMessage(
        error.message || "Unable to load outfits. Please try again."
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

  const handleSave = async (outfit, index) => {
    if (savingIndex !== null || loading) return;

    setSavingIndex(index);
    setMessage("");

    try {
      const items = (outfit.items ?? []).map((item) => ({
        id: item.id ?? item._id,
      }));

      if (items.length === 0 || items.some((item) => !item.id)) {
        setMessage("This outfit has invalid item data and cannot be saved.");
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
        error.message || "Unable to save outfit. Please try again."
      );
    } finally {
      setSavingIndex(null);
    }
  };

  if (!criteria) {
    return (
      <main>
        <h1>Recommended Outfits</h1>
        <p>Recommendation criteria are missing. Please try again.</p>

        <button
          type="button"
          onClick={() => navigate("/recommendation")}
        >
          Back to Criteria
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Recommended Outfits</h1>

      <p>Outfits are sorted by total score, highest first.</p>

      <button
        type="button"
        onClick={() => navigate("/recommendation")}
        disabled={savingIndex !== null || loading}
      >
        Back to Criteria
      </button>

      {message && <p role="alert">{message}</p>}

      {loading && <p>Loading recommendations...</p>}

      {!loading && recommendations.length === 0 && (
        <p>No recommendations found. Please try again.</p>
      )}

      {!loading &&
        recommendations.map((outfit, index) => (
          <article key={`${pagination.page}-${index}`}>
            <h2>
              Outfit {index + 1 + (pagination.page - 1) * 4}
            </h2>

            {(outfit.items ?? []).map((item, itemIndex) => {
              const imageUrl = getItemImageUrl(item);

              return (
                <div key={item.id ?? item._id ?? itemIndex}>
                  <p>
                    {item.name} — {item.category}
                  </p>

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name || "Outfit item"}
                      width="150"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <p>No image available</p>
                  )}
                </div>
              );
            })}

            <p>Item score: {outfit.itemScore}</p>
            <p>Color harmony: {outfit.colorScore}</p>
            <p>Total score: {outfit.totalScore}</p>

            <button
              type="button"
              onClick={() => handleSave(outfit, index)}
              disabled={savingIndex !== null || loading}
            >
              {savingIndex === index ? "Saving..." : "Save"}
            </button>
          </article>
        ))}

      <div>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={
            loading ||
            savingIndex !== null ||
            pagination.page <= 1
          }
        >
          Previous
        </button>

        <span>
          {" "}Page {pagination.page} of {pagination.totalPages}{" "}
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
          Next
        </button>
      </div>
    </main>
  );
}

export default RecommendationResult;