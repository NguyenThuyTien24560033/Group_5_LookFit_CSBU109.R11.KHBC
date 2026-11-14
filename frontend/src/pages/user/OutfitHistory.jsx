
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, X, ArrowRight } from "lucide-react";
import {
  getOutfitHistory,
  finalizeOutfit,
  deleteOutfit,
  updateOutfitVisibility,
} from "../../services/outfit.service.js";
import "./OutfitHistory.css";

const PREVIEW_MODE = true;
const STORAGE_KEY = "lookfit_preview_outfits";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getOutfitId = (outfit) => outfit?._id ?? outfit?.id;

const isDraft = (outfit) =>
  String(outfit?.status || "draft").toUpperCase() === "DRAFT";

const isFinal = (outfit) =>
  String(outfit?.status || "").toUpperCase() === "FINAL";

const isPublic = (outfit) =>
  outfit?.isPublic === true || outfit?.visibility === "public";

function getImage(item) {
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

function readPreview() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writePreview(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function OutfitHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(location.state?.message || "");
  const [isError, setIsError] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  useEffect(() => {
    if (!selectedOutfit) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedOutfit(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedOutfit]);

  const loadHistory = useCallback(async () => {
    try {
      const result = PREVIEW_MODE
        ? readPreview()
        : await getOutfitHistory();

      const data = Array.isArray(result)
        ? result
        : result?.outfits ?? result?.data ?? [];

      setOutfits(data);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to load outfit history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, location.key]);

  const handleFinalize = async (outfit) => {
    const id = getOutfitId(outfit);
    if (!id || processingId !== null || !isDraft(outfit)) return;

    if (!window.confirm("Finalize this outfit? You cannot edit it afterward.")) {
      return;
    }

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().map((item) =>
          String(getOutfitId(item)) === String(id)
            ? {
                ...item,
                status: "FINAL",
                isPublic: false,
                visibility: "private",
                finalizedAt: new Date().toISOString(),
              }
            : item
        );

        writePreview(updated);
        setOutfits(updated);
      } else {
        await finalizeOutfit(id);
        await loadHistory();
      }

      setMessage("Outfit finalized successfully. It is now private.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to finalize outfit.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleVisibility = async (outfit) => {
    const id = getOutfitId(outfit);
    if (!id || processingId !== null || !isFinal(outfit)) return;

    const nextPublic = !isPublic(outfit);

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().map((item) =>
          String(getOutfitId(item)) === String(id)
            ? {
                ...item,
                isPublic: nextPublic,
                visibility: nextPublic ? "public" : "private",
              }
            : item
        );

        writePreview(updated);
        setOutfits(updated);
      } else {
        await updateOutfitVisibility(id, nextPublic);
        await loadHistory();
      }

      setMessage(nextPublic ? "Outfit is now public." : "Outfit is now private.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to change visibility.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (outfit) => {
    const id = getOutfitId(outfit);
    if (!id || processingId !== null) return;

    if (!window.confirm("Are you sure you want to delete this outfit?")) {
      return;
    }

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().filter(
          (item) => String(getOutfitId(item)) !== String(id)
        );
        writePreview(updated);
        setOutfits(updated);
      } else {
        await deleteOutfit(id);
        await loadHistory();
      }

      setMessage("Outfit deleted successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to delete outfit.");
    } finally {
      setProcessingId(null);
    }
  };

  const draftCount = outfits.filter(isDraft).length;
  const finalCount = outfits.filter(isFinal).length;

  const filteredOutfits = outfits.filter((outfit) => {
    if (filter === "draft") return isDraft(outfit);
    if (filter === "final") return isFinal(outfit);
    return true;
  });

  return (
    <main className="outfit-history-page">
      <div className="outfit-history-container">
        <button
          className="history-back"
          onClick={() => navigate("/recommendation")}
        >
          ← Back
        </button>

        <header className="outfit-history-header">
          <div>
            <p className="history-eyebrow">YOUR PERSONAL WARDROBE</p>
            <h1>
              Your outfit <em>history.</em>
            </h1>
            <p className="history-description">
              Your saved looks, all in one place. Edit your drafts and
              manage your final outfits.
            </p>
          </div>

          <button
            className="history-find-button"
            onClick={() => navigate("/recommendation")}
          >
            Find New Outfits →
          </button>
        </header>

        {message && (
          <p className={`history-message ${isError ? "history-message-error" : ""}`}>
            {message}
          </p>
        )}

        <div className="history-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All Looks ({outfits.length})
          </button>
          <button
            className={filter === "draft" ? "active" : ""}
            onClick={() => setFilter("draft")}
          >
            Drafts ({draftCount})
          </button>
          <button
            className={filter === "final" ? "active" : ""}
            onClick={() => setFilter("final")}
          >
            Final ({finalCount})
          </button>
        </div>

        {loading ? (
          <div className="history-empty">Loading your outfits...</div>
        ) : filteredOutfits.length === 0 ? (
          <div className="history-empty">
  <span className="history-empty-icon">♡</span>
  <h2>No outfits here yet.</h2>
  <p>Your saved looks will appear here.</p>
</div>
        ) : (
          <div className="history-grid">
            {filteredOutfits.map((outfit, index) => {
              const id = getOutfitId(outfit);
              const draft = isDraft(outfit);
              const final = isFinal(outfit);
              const publicOutfit = isPublic(outfit);
              const processing = String(processingId) === String(id);
              const items = outfit.items ?? [];
              const criteria = outfit.criteria ?? outfit;
              const coverImage =
                outfit.imageUrl || items.map(getImage).find(Boolean);

              return (
                <article className="history-card" key={id ?? index}>
                  <div className="history-card-image">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={outfit.name || "Saved outfit"}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="history-image-placeholder">
                        LOOKFIT
                      </div>
                    )}

                    <span className={`history-status ${
                      draft ? "history-status-draft" : "history-status-final"
                    }`}>
                      {draft ? "✎ Draft" : "✓ Final"}
                    </span>

                    <span className="history-visibility">
                      {publicOutfit ? "◉ Public" : "♡ Private"}
                    </span>
                  </div>

                  <div className="history-card-content">
                    <h2>
                      {outfit.name ||
                        (draft ? "Draft Outfit" : "Final Outfit")}
                    </h2>

                    <p className="history-card-subtitle">
                      {items.length} fashion items
                    </p>

                    <div className="history-criteria">
                      <span>Occasion: {criteria.case || "N/A"}</span>
                      <span>Style: {criteria.style || "N/A"}</span>
                      <span>Season: {criteria.season || "N/A"}</span>
                    </div>

                    <button
                      className="history-view-button"
                      type="button"
                      onClick={() => setSelectedOutfit(outfit)}
                    >
                      <Eye size={17} /> View
                    </button>

                    <div className="history-card-actions">
                      {draft && (
                        <>
                          <button
                            className="history-action-edit"
                            disabled={processingId !== null}
                            onClick={() =>
                              navigate(`/outfits/${id}/edit`, { state: { outfit } })
                            }
                          >
                            Edit Draft
                          </button>

                          <button
                            className="history-action-primary"
                            disabled={processingId !== null}
                            onClick={() => handleFinalize(outfit)}
                          >
                            {processing ? "Processing..." : "Finalize"}
                          </button>
                        </>
                      )}

                      {final && (
                        <button
                          className="history-action-primary"
                          disabled={processingId !== null}
                          onClick={() => handleVisibility(outfit)}
                        >
                          {processing
                            ? "Processing..."
                            : publicOutfit
                            ? "Make Private"
                            : "Make Public"}
                        </button>
                      )}

                      <button
                        className="history-action-delete"
                        disabled={processingId !== null}
                        onClick={() => handleDelete(outfit)}
                      >
                        {processing ? "Processing..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedOutfit && (() => {
        const previewItems = Array.isArray(selectedOutfit.items)
          ? selectedOutfit.items
          : [];
        const previewImage =
          selectedOutfit.imageUrl || previewItems.map(getImage).find(Boolean);
        const score = selectedOutfit.matchScore ?? selectedOutfit.score ?? selectedOutfit.totalScore;
        const savedAt = selectedOutfit.savedAt ?? selectedOutfit.createdAt;
        const parsedDate = savedAt ? new Date(savedAt) : null;
        const formattedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "numeric", minute: "2-digit",
            })
          : null;

        return (
          <div
            className="history-preview-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedOutfit(null);
            }}
          >
            <section
              className="history-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-preview-title"
            >
              <div className="history-preview-image">
                {previewImage ? (
                  <img src={previewImage} alt={selectedOutfit.name || "Saved outfit"} />
                ) : (
                  <div className="history-preview-placeholder">LOOKFIT</div>
                )}
              </div>
              <div className="history-preview-details">
                <button
                  type="button"
                  className="history-preview-close"
                  aria-label="Close outfit preview"
                  onClick={() => setSelectedOutfit(null)}
                >
                  <X size={21} />
                </button>
                <p className="history-preview-eyebrow">SAVED LOOK</p>
                <h2 id="history-preview-title">
                  {selectedOutfit.name || "Saved outfit"}
                </h2>
                {score !== undefined && score !== null && (
                  <p className="history-preview-score">
                    {String(score).includes("%") ? score : `${score}%`} match
                  </p>
                )}
                <div className="history-preview-items">
                  <h3>In this look</h3>
                  {previewItems.length > 0 ? (
                    <ul>
                      {previewItems.map((item, index) => (
                        <li key={item?._id ?? item?.id ?? index}>
                          {typeof item === "string"
                            ? item
                            : item?.name || item?.category || `Item ${index + 1}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No items available.</p>
                  )}
                </div>
                {formattedDate && (
                  <p className="history-preview-date">Saved {formattedDate}</p>
                )}
                <button
                  type="button"
                  className="history-preview-similar"
                  onClick={() => {
                    setSelectedOutfit(null);
                    navigate("/recommendation");
                  }}
                >
                  Find a similar look <ArrowRight size={17} />
                </button>
              </div>
            </section>
          </div>
        );
      })()}
    </main>
  );
}

export default OutfitHistory;
