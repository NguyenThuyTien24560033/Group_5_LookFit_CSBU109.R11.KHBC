import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './OutfitHistory.css'

import {
  getOutfitHistory,
  finalizeOutfit,
  deleteOutfit,
  updateOutfitVisibility,
} from "../../services/outfit.service.js";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getOutfitId(outfit) {
  return outfit?._id ?? outfit?.id;
}

function getItemId(item) {
  return item?._id ?? item?.id ?? item?.catalogId;
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

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

function OutfitHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(
    location.state?.message || ""
  );
  const [isError, setIsError] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const result = await getOutfitHistory();

      const history = Array.isArray(result)
        ? result
        : result?.outfits ?? result?.data ?? [];

      setOutfits(history);
    } catch (error) {
      setIsError(true);
      setMessage(
        getErrorMessage(error, "Unable to load outfit history.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFinalize = async (outfit) => {
    const outfitId = getOutfitId(outfit);

    if (!outfitId || processingId !== null) return;

    setProcessingId(outfitId);
    setMessage("");
    setIsError(false);

    try {
      await finalizeOutfit(outfitId);
      await loadHistory();

      setMessage(
        "Outfit finalized successfully. Other drafts in this recommendation group have been removed."
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        getErrorMessage(error, "Unable to finalize outfit.")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVisibility = async (outfit) => {
    const outfitId = getOutfitId(outfit);

    if (!outfitId || processingId !== null) return;

    if (outfit.status !== "FINAL") {
      setIsError(true);
      setMessage("Only final outfits can change visibility.");
      return;
    }

    const nextIsPublic = !outfit.isPublic;

    setProcessingId(outfitId);
    setMessage("");
    setIsError(false);

    try {
      await updateOutfitVisibility(outfitId, nextIsPublic);
      await loadHistory();

      setMessage(
        nextIsPublic
          ? "Outfit is now public."
          : "Outfit is now private."
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        getErrorMessage(
          error,
          "Unable to update outfit visibility."
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (outfit) => {
    const outfitId = getOutfitId(outfit);

    if (!outfitId || processingId !== null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${
        outfit.status === "DRAFT" ? "draft" : "final"
      } outfit?`
    );

    if (!confirmed) return;

    setProcessingId(outfitId);
    setMessage("");
    setIsError(false);

    try {
      await deleteOutfit(outfitId);

      setOutfits((current) =>
        current.filter(
          (item) => String(getOutfitId(item)) !== String(outfitId)
        )
      );

      setMessage("Outfit deleted successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(
        getErrorMessage(error, "Unable to delete outfit.")
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <main><p>Loading outfit history...</p></main>;
  }

  return (
    <main>
      <header>
        <h1>Outfit History</h1>

        {message && (
          <p
            role="status"
            style={{ color: isError ? "#b91c1c" : "inherit" }}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate("/recommendation")}
          disabled={processingId !== null}
        >
          Find New Outfits
        </button>
      </header>

      {outfits.length === 0 ? (
        <p>No outfit history yet.</p>
      ) : (
        outfits.map((outfit) => {
          const outfitId = getOutfitId(outfit);
          const isDraft = outfit.status === "DRAFT";
          const isProcessing =
            String(processingId) === String(outfitId);

          return (
            <article key={outfitId}>
              <h2>
                {isDraft ? "Draft Outfit" : "Final Outfit"}
              </h2>

              <p>Occasion: {outfit.case || "N/A"}</p>
              <p>Style: {outfit.style || "N/A"}</p>
              <p>Season: {outfit.season || "N/A"}</p>
              <p>Weather: {outfit.weather || "N/A"}</p>
              <p>Lifestyle: {outfit.lifestyle || "N/A"}</p>
              <p>Status: {outfit.status || "N/A"}</p>
              <p>
                Visibility: {outfit.isPublic ? "Public" : "Private"}
              </p>

              <h3>Items</h3>

              {outfit.items?.length ? (
                outfit.items.map((item, index) => {
                  const imageUrl = getItemImageUrl(item);

                  return (
                    <div key={getItemId(item) ?? index}>
                      <p>
                        {item.name || "Unnamed item"} —{" "}
                        {item.category || "Item"}
                      </p>

                      {item.color && <p>Color: {item.color}</p>}

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
                        <p>No image available.</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p>No items in this outfit.</p>
              )}

              {isDraft && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/outfits/${outfitId}/edit`)
                    }
                    disabled={processingId !== null}
                  >
                    Edit Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalize(outfit)}
                    disabled={processingId !== null}
                  >
                    {isProcessing ? "Processing..." : "Finalize"}
                  </button>
                </>
              )}

              {!isDraft && outfit.status === "FINAL" && (
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(outfit)}
                  disabled={processingId !== null}
                >
                  {isProcessing
                    ? "Processing..."
                    : outfit.isPublic
                      ? "Make Private"
                      : "Make Public"}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(outfit)}
                disabled={processingId !== null}
              >
                {isProcessing ? "Processing..." : "Delete"}
              </button>
            </article>
          );
        })
      )}
    </main>
  );
}

export default OutfitHistory;