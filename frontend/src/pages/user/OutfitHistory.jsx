import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, X, ArrowRight, Trash2, ArrowLeft, Globe, Lock } from "lucide-react";

import {
  getOutfitHistory,
  finalizeOutfit,
  deleteOutfit,
  updateOutfitVisibility,
} from "../../services/outfit.service.js";

import "./OutfitHistory.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://group-5-lookfit-csbu109-r11-khbc.onrender.com/api";

function getOutfitId(outfit) {
  return outfit?._id ?? outfit?.id ?? null;
}

function isDraft(outfit) {
  return String(outfit?.status || "DRAFT").toUpperCase() === "DRAFT";
}

function isFinal(outfit) {
  return String(outfit?.status || "").toUpperCase() === "FINAL";
}

function isPublic(outfit) {
  return outfit?.isPublic === true || outfit?.visibility === "public";
}

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

function formatSavedDate(outfit) {
  const value =
    outfit?.savedAt ?? outfit?.createdAt ?? outfit?.updatedAt;

  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getOutfitCover(outfit) {
  const items = Array.isArray(outfit?.items) ? outfit.items : [];
  return (
    outfit?.imageUrl ||
    items.map(getItemImageUrl).find(Boolean) ||
    ""
  );
}

export default function OutfitHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(location.state?.message || "");
  const [isError, setIsError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  // ================= TẢI LỊCH SỬ THẬT TỪ DATABASE =================
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOutfitHistory();
      const data = Array.isArray(result)
        ? result
        : result?.outfits ?? result?.data ?? [];
      setOutfits(data);
    } catch (error) {
      setIsError(true);
      setMessage(error?.message || "Unable to load outfit history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, location.key]);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setIsError(false);
    }
  }, [location.key, location.state]);

  // ================= CHUYỂN HƯỚNG CHỈNH SỬA OUTFIT =================
  const handleEditDraft = (outfit) => {
    if (processingId !== null || !isDraft(outfit)) return;
    const id = getOutfitId(outfit);
    if (!id) {
      setIsError(true);
      setMessage("Unable to edit: outfit ID is missing.");
      return;
    }
    navigate(`/outfits/${id}/edit`);
  };

  // ================= CHỐT OUTFIT (FINALIZE) =================
  const handleFinalize = async (outfit) => {
    const id = getOutfitId(outfit);
    if (!id || processingId !== null || !isDraft(outfit)) return;

    if (!window.confirm("Finalize this outfit? You cannot edit its items afterward.")) {
      return;
    }

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      await finalizeOutfit(id);
      await loadHistory();
      setSelectedOutfit(null);
      setMessage("Outfit finalized successfully. It is now private.");
    } catch (error) {
      setIsError(true);
      setMessage(error?.message || "Unable to finalize outfit.");
    } finally {
      setProcessingId(null);
    }
  };

  // ================= BẬT / TẮT CÔNG KHAI (VISIBILITY) =================
  const handleVisibility = async (outfit) => {
    const id = getOutfitId(outfit);
    if (!id || processingId !== null || !isFinal(outfit)) return;

    const nextPublic = !isPublic(outfit);
    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      await updateOutfitVisibility(id, nextPublic);
      await loadHistory();
      setMessage(nextPublic ? "Outfit is now public on Community feed." : "Outfit is now private.");
    } catch (error) {
      setIsError(true);
      setMessage(error?.message || "Unable to change visibility.");
    } finally {
      setProcessingId(null);
    }
  };

  // ================= XÓA OUTFIT =================
  const handleDelete = async () => {
    if (!deleteTarget || processingId !== null) return;
    const id = getOutfitId(deleteTarget);
    if (!id) return;

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      await deleteOutfit(id);
      await loadHistory();
      setSelectedOutfit(null);
      setDeleteTarget(null);
      setMessage("Outfit deleted successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(error?.message || "Unable to delete outfit.");
    } finally {
      setProcessingId(null);
    }
  };

  // Dữ liệu hiển thị & bộ lọc
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
        {/* BACK BUTTON */}
        <Link to="/home" className="history-back lookfit-page-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* HEADER */}
        <header className="outfit-history-header">
          <div>
            <p className="history-eyebrow">YOUR WARDROBE • OUTFIT HISTORY</p>
            <h1>
              Saved <em>Looks.</em>
            </h1>
            <p className="history-description">
              Browse, edit and manage the outfit combinations saved to your profile.
            </p>
          </div>

          <button
            type="button"
            className="history-find-button"
            onClick={() => navigate("/recommendation")}
          >
            Create New Look →
          </button>
        </header>

        {/* MESSAGE */}
        {message && (
          <div
            className={`history-message ${isError ? "history-message-error" : ""}`}
            role={isError ? "alert" : "status"}
          >
            {message}
          </div>
        )}

        {/* FILTERS */}
        <div className="history-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All looks ({outfits.length})
          </button>
          <button
            type="button"
            className={filter === "draft" ? "active" : ""}
            onClick={() => setFilter("draft")}
          >
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            className={filter === "final" ? "active" : ""}
            onClick={() => setFilter("final")}
          >
            Finalized ({finalCount})
          </button>
        </div>

        {/* LOADING */}
        {loading && <p style={{ color: "#a58d85", padding: "40px 0" }}>Loading your outfit history from database...</p>}

        {/* EMPTY STATE */}
        {!loading && filteredOutfits.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">✦</div>
            <h2>No looks found</h2>
            <p>
              {filter === "all"
                ? "You haven't saved any outfits yet. Start styling to build your collection!"
                : `No ${filter} outfits found.`}
            </p>
            <button
              type="button"
              className="history-find-button"
              style={{ marginTop: 15 }}
              onClick={() => navigate("/recommendation")}
            >
              Get Recommendations
            </button>
          </div>
        )}

        {/* OUTFITS GRID */}
        {!loading && filteredOutfits.length > 0 && (
          <div className="history-grid">
            {filteredOutfits.map((outfit) => {
              const id = getOutfitId(outfit);
              const draft = isDraft(outfit);
              const final = isFinal(outfit);
              const pub = isPublic(outfit);
              const cover = getOutfitCover(outfit);
              const items = Array.isArray(outfit.items) ? outfit.items : [];
              const isProcessing = String(processingId) === String(id);

              return (
                <article className="history-card" key={id}>
                  <div className="history-card-image">
                    {cover ? (
                      <img src={cover} alt={outfit.name || "Saved outfit"} loading="lazy" />
                    ) : (
                      <div className="history-image-placeholder">LOOKFIT</div>
                    )}

                    {/* STATUS BADGE */}
                    <span className={`history-status ${final ? "history-status-final" : ""}`}>
                      {draft ? "DRAFT" : "FINAL"}
                    </span>

                    {/* VISIBILITY BADGE */}
                    {final && (
                      <span className="history-visibility">
                        {pub ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Globe size={11} /> PUBLIC
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Lock size={11} /> PRIVATE
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="history-card-content">
                    <h2>{outfit.name || (draft ? "Draft Look" : "Final Look")}</h2>
                    <p className="history-card-subtitle">{items.length} items in this look</p>

                    <div className="history-criteria">
                      {outfit.case && <span>Occasion: {outfit.case}</span>}
                      {outfit.style && <span>Style: {outfit.style}</span>}
                      {outfit.season && <span>Season: {outfit.season}</span>}
                    </div>

                    {/* VIEW DETAILS */}
                    <button
                      type="button"
                      className="history-view-button"
                      onClick={() => setSelectedOutfit(outfit)}
                    >
                      <Eye size={17} /> View Details
                    </button>

                    {/* ACTIONS */}
                    <div className="history-card-actions">
                      {draft && (
                        <>
                          <button
                            type="button"
                            className="history-action-edit"
                            disabled={isProcessing}
                            onClick={() => handleEditDraft(outfit)}
                            title="Swap items in this draft"
                          >
                            Edit Item
                          </button>
                          <button
                            type="button"
                            className="history-action-primary"
                            disabled={isProcessing}
                            onClick={() => handleFinalize(outfit)}
                          >
                            {isProcessing ? "Processing..." : "Finalize"}
                          </button>
                        </>
                      )}

                      {final && (
                        <button
                          type="button"
                          className="history-action-primary"
                          disabled={isProcessing}
                          onClick={() => handleVisibility(outfit)}
                        >
                          {isProcessing
                            ? "Processing..."
                            : pub
                            ? "Make Private"
                            : "Make Public"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="history-action-delete"
                        disabled={isProcessing}
                        onClick={() => setDeleteTarget(outfit)}
                        title="Delete outfit"
                      >
                        <Trash2 size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL XEM CHI TIẾT OUTFIT (BREAKDOWN STYLE) ================= */}
      {selectedOutfit && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedOutfit(null)}
        >
          <div
            className="history-breakdown-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="history-breakdown-close"
              onClick={() => setSelectedOutfit(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <p className="history-breakdown-eyebrow">
              {isDraft(selectedOutfit) ? "DRAFT LOOK" : "FINALIZED LOOK"} • OUTFIT BREAKDOWN
            </p>

            <h2 className="history-breakdown-title">
              {selectedOutfit.name ||
                (selectedOutfit.case
                  ? `${selectedOutfit.case.charAt(0).toUpperCase() + selectedOutfit.case.slice(1)} Look`
                  : "Outfit Details")}{" "}
              <em>Pieces</em>
            </h2>

            <p className="history-breakdown-meta">
              {selectedOutfit.bodyShape && (
                <span>
                  Body shape:{" "}
                  <strong style={{ textTransform: "uppercase" }}>
                    {selectedOutfit.bodyShape}
                  </strong>{" "}
                  ·{" "}
                </span>
              )}
              {selectedOutfit.case && (
                <span>
                  Occasion:{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {selectedOutfit.case}
                  </strong>{" "}
                  ·{" "}
                </span>
              )}
              {selectedOutfit.style && (
                <span>
                  Style:{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {selectedOutfit.style}
                  </strong>
                </span>
              )}
            </p>

            <div className="history-breakdown-items">
              {(selectedOutfit.items || []).map((item, idx) => {
                const imgUrl = getItemImageUrl(item);
                const catalogId =
                  item.catalogId?._id ??
                  item.catalogId?.id ??
                  item.catalogId ??
                  item._id ??
                  item.id;

                return (
                  <div className="history-breakdown-item" key={item._id || idx}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="history-breakdown-item-img"
                      />
                    ) : (
                      <div className="history-breakdown-item-placeholder">
                        {item.category?.toUpperCase() || "ITEM"}
                      </div>
                    )}

                    <div className="history-breakdown-item-info">
                      <span className="history-breakdown-item-cat">
                        {item.category}
                        {item.color ? ` · ${item.color}` : ""}
                      </span>
                      <h4 className="history-breakdown-item-name">
                        {item.name || "Unnamed Item"}
                      </h4>
                    </div>

                    {catalogId && (
                      <button
                        type="button"
                        className="history-breakdown-item-btn"
                        onClick={() => navigate(`/catalog/${catalogId}`)}
                      >
                        View detail →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {formatSavedDate(selectedOutfit) && (
              <p className="history-breakdown-date">
                Saved on {formatSavedDate(selectedOutfit)}
              </p>
            )}

            <div className="history-breakdown-footer">
              <button
                type="button"
                className="history-modal-button"
                onClick={() => {
                  setSelectedOutfit(null);
                  navigate("/recommendation");
                }}
              >
                Find a similar look <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="history-breakdown-close-btn"
                onClick={() => setSelectedOutfit(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA ================= */}
      {deleteTarget && (
        <div
          className="history-delete-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <section
            className="history-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-delete-icon">
              <Trash2 size={28} strokeWidth={1.8} />
            </div>
            <h2 id="history-delete-title">Delete this outfit?</h2>
            <p id="history-delete-description">
              Are you sure you want to remove this outfit from your history? This action cannot be undone.
            </p>
            <div className="history-delete-actions">
              <button
                type="button"
                className="history-delete-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={processingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="history-delete-confirm"
                onClick={handleDelete}
                disabled={processingId !== null}
              >
                {processingId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}