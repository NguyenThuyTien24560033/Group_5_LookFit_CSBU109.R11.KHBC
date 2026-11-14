
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, X, ArrowRight, Trash2 } from "lucide-react";

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

const CATEGORIES = [
  "top",
  "bottom",
  "shoes",
  "accessory",
  "dress",
  "outerwear",
];

const PAGE_SIZE = 8;

function getOutfitId(outfit) {
  return outfit?._id ?? outfit?.id ?? outfit?.outfitId ?? null;
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

function normalizeCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (category === "accessories") return "accessory";

  return category;
}

function getProductKey(item) {
  if (typeof item === "string") {
    return `text:${item}`;
  }

  const id =
    item?.catalogId?._id ??
    item?.catalogId?.id ??
    item?.catalogId ??
    item?._id ??
    item?.id;

  if (id != null && typeof id !== "object") {
    return `${normalizeCategory(item?.category)}:${String(id)}`;
  }

  return [
    normalizeCategory(item?.category),
    String(item?.name || "").trim().toLowerCase(),
    String(item?.color || "").trim().toLowerCase(),
  ].join(":");
}

function getImage(item) {
  if (!item) return "";

  if (
    typeof item === "object" &&
    typeof item.imageUrl === "string" &&
    item.imageUrl.trim()
  ) {
    return item.imageUrl.trim();
  }

  const imageId =
    typeof item === "string"
      ? item
      : item.imageId?._id ??
        item.imageId?.id ??
        item.imageId;

  if (!imageId || typeof imageId === "object") return "";

  return `${API_BASE_URL}/images/${imageId}`;
}

function readPreview() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writePreview(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensurePreviewIds() {
  const saved = readPreview();
  let changed = false;

  const normalized = saved.map((outfit) => {
    const id = getOutfitId(outfit);

    if (id != null && String(id) !== "") {
      return outfit;
    }

    changed = true;

    return {
      ...outfit,
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `preview-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,
    };
  });

  if (changed) writePreview(normalized);

  return normalized;
}

function formatSavedDate(outfit) {
  const value =
    outfit?.savedAt ??
    outfit?.createdAt ??
    outfit?.updatedAt;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOutfitCover(outfit) {
  const items = Array.isArray(outfit?.items) ? outfit.items : [];

  return (
    outfit?.imageUrl ||
    items.map(getImage).find(Boolean) ||
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
  const [message, setMessage] = useState(
    location.state?.message || ""
  );
  const [isError, setIsError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  const [editingOutfit, setEditingOutfit] = useState(null);
  const [editCategory, setEditCategory] = useState("top");
  const [editPage, setEditPage] = useState(1);
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // =========================
  // LOAD HISTORY
  // =========================

  const loadHistory = useCallback(async () => {
    setLoading(true);

    try {
      const result = PREVIEW_MODE
        ? ensurePreviewIds()
        : await getOutfitHistory();

      const data = Array.isArray(result)
        ? result
        : result?.outfits ?? result?.data ?? [];

      setOutfits(data);
    } catch (error) {
      setIsError(true);
      setMessage(
        error?.message || "Unable to load outfit history."
      );
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

  // =========================
  // MODAL BEHAVIOR
  // =========================

  useEffect(() => {
    if (!selectedOutfit && !editingOutfit && !deleteTarget) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (deleteTarget && processingId === null) {
        setDeleteTarget(null);
      } else if (editingOutfit && !editSaving) {
        setEditingOutfit(null);
        setEditMessage("");
      } else if (selectedOutfit) {
        setSelectedOutfit(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedOutfit, editingOutfit, editSaving, deleteTarget, processingId]);

  // =========================
  // EDIT MODAL
  // =========================

  const handleEditDraft = (outfit) => {
    if (processingId !== null || !isDraft(outfit)) return;

    const id = getOutfitId(outfit);

    if (id == null) {
      setIsError(true);
      setMessage("Unable to edit: outfit ID is missing.");
      return;
    }

    setSelectedOutfit(null);

    setEditingOutfit({
      ...outfit,
      items: Array.isArray(outfit.items)
        ? [...outfit.items]
        : [],
    });

    const firstCategory = (outfit.items ?? [])
      .map((item) => normalizeCategory(item?.category))
      .find((category) => CATEGORIES.includes(category));

    setEditCategory(firstCategory || "top");
    setEditPage(1);
    setEditMessage("");
  };

  const closeEdit = () => {
    if (editSaving) return;

    setEditingOutfit(null);
    setEditMessage("");
  };

  const handleRemoveEditItem = (indexToRemove) => {
    if (editSaving) return;

    setEditingOutfit((current) => {
      if (!current) return null;

      return {
        ...current,
        items: current.items.filter(
          (_, index) => index !== indexToRemove
        ),
      };
    });

    setEditMessage("");
  };

  const handleSelectEditItem = (product) => {
    if (editSaving) return;

    setEditingOutfit((current) => {
      if (!current) return null;

      const items = [...current.items];

      const existingIndex = items.findIndex(
        (item) =>
          normalizeCategory(item?.category) ===
          normalizeCategory(product.category)
      );

      if (existingIndex >= 0) {
        items[existingIndex] = { ...product };
      } else {
        items.push({ ...product });
      }

      return {
        ...current,
        items,
      };
    });

    setEditMessage(
      `${product.name || "Item"} selected.`
    );
  };

  const handleSaveEdit = () => {
    if (!editingOutfit || editSaving) return;

    if (!editingOutfit.items.length) {
      setEditMessage(
        "Your outfit must contain at least one item."
      );
      return;
    }

    const id = getOutfitId(editingOutfit);

    if (id == null) {
      setEditMessage("Outfit ID is missing.");
      return;
    }

    if (!PREVIEW_MODE) {
      setEditMessage(
        "Backend editing is not configured yet."
      );
      return;
    }

    setEditSaving(true);

    try {
      const saved = readPreview();

      const index = saved.findIndex(
        (entry) =>
          String(getOutfitId(entry)) === String(id)
      );

      if (index < 0 || !isDraft(saved[index])) {
        throw new Error(
          "Draft no longer exists or has been finalized."
        );
      }

      saved[index] = {
        ...saved[index],
        items: editingOutfit.items,
        updatedAt: new Date().toISOString(),
      };

      writePreview(saved);
      setOutfits(saved);

      setMessage("Draft updated successfully.");
      setIsError(false);

      setEditingOutfit(null);
      setEditMessage("");
    } catch (error) {
      setEditMessage(
        error?.message || "Unable to save changes."
      );
    } finally {
      setEditSaving(false);
    }
  };

  // =========================
  // PREVIEW CATALOG
  // =========================

  const catalog = useMemo(() => {
    const unique = new Map();

    outfits.forEach((outfit) => {
      (outfit.items ?? []).forEach((item) => {
        if (!item || typeof item !== "object") return;

        const key = getProductKey(item);

        if (!unique.has(key)) {
          unique.set(key, item);
        }
      });
    });

    return [...unique.values()];
  }, [outfits]);

  const editProducts = useMemo(() => {
    return catalog.filter(
      (item) =>
        normalizeCategory(item.category) === editCategory
    );
  }, [catalog, editCategory]);

  const editTotalPages = Math.max(
    1,
    Math.ceil(editProducts.length / PAGE_SIZE)
  );

  const visibleEditProducts = editProducts.slice(
    (editPage - 1) * PAGE_SIZE,
    editPage * PAGE_SIZE
  );

  // =========================
  // FINALIZE
  // =========================

  const handleFinalize = async (outfit) => {
    const id = getOutfitId(outfit);

    if (
      id == null ||
      processingId !== null ||
      !isDraft(outfit)
    ) return;

    if (
      !window.confirm(
        "Finalize this outfit? You cannot edit it afterward."
      )
    ) return;

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().map((entry) =>
          String(getOutfitId(entry)) === String(id)
            ? {
                ...entry,
                status: "FINAL",
                isPublic: false,
                visibility: "private",
                finalizedAt: new Date().toISOString(),
              }
            : entry
        );

        writePreview(updated);
        setOutfits(updated);
      } else {
        await finalizeOutfit(id);
        await loadHistory();
      }

      setSelectedOutfit(null);
      setMessage(
        "Outfit finalized successfully. It is now private."
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error?.message || "Unable to finalize outfit."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================
  // VISIBILITY
  // =========================

  const handleVisibility = async (outfit) => {
    const id = getOutfitId(outfit);

    if (
      id == null ||
      processingId !== null ||
      !isFinal(outfit)
    ) return;

    const nextPublic = !isPublic(outfit);

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().map((entry) =>
          String(getOutfitId(entry)) === String(id)
            ? {
                ...entry,
                isPublic: nextPublic,
                visibility: nextPublic
                  ? "public"
                  : "private",
              }
            : entry
        );

        writePreview(updated);
        setOutfits(updated);
      } else {
        await updateOutfitVisibility(id, nextPublic);
        await loadHistory();
      }

      setMessage(
        nextPublic
          ? "Outfit is now public."
          : "Outfit is now private."
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error?.message || "Unable to change visibility."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async () => {
    if (!deleteTarget || processingId !== null) return;

    const id = getOutfitId(deleteTarget);
    if (id == null) return;

    setProcessingId(id);
    setMessage("");
    setIsError(false);

    try {
      if (PREVIEW_MODE) {
        const updated = readPreview().filter(
          (entry) => String(getOutfitId(entry)) !== String(id)
        );
        writePreview(updated);
        setOutfits(updated);
      } else {
        await deleteOutfit(id);
        await loadHistory();
      }

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

  // =========================
  // DISPLAY DATA
  // =========================

  const draftCount = outfits.filter(isDraft).length;
  const finalCount = outfits.filter(isFinal).length;

  const filteredOutfits = outfits.filter((outfit) => {
    if (filter === "draft") return isDraft(outfit);
    if (filter === "final") return isFinal(outfit);
    return true;
  });

  const previewItems = Array.isArray(selectedOutfit?.items)
    ? selectedOutfit.items
    : [];

  const previewImage = selectedOutfit
    ? getOutfitCover(selectedOutfit)
    : "";

  const previewScore = selectedOutfit
    ? selectedOutfit.matchScore ??
      selectedOutfit.score ??
      selectedOutfit.totalScore
    : null;

  const previewDate = selectedOutfit
    ? formatSavedDate(selectedOutfit)
    : null;

  // =========================
  // PAGE
  // =========================

  return (
    <main className="outfit-history-page">
      <div className="outfit-history-container">
       
<button
  type="button"
  className="history-back"
  onClick={() => navigate("/home")}
>
  <span className="history-back-arrow">←</span>
  <span>Back</span>
</button>


        <header className="outfit-history-header">
          <div>
            <p className="history-eyebrow">
              YOUR PERSONAL WARDROBE
            </p>

            <h1>
              Your outfit <em>history.</em>
            </h1>

            <p className="history-description">
              Your saved looks, all in one place.
              Edit your drafts and manage your final outfits.
            </p>
          </div>

          <button
            type="button"
            className="history-find-button"
            onClick={() => navigate("/recommendation")}
          >
            Find New Outfits →
          </button>
        </header>

        {message && (
          <p
            className={`history-message ${
              isError ? "history-message-error" : ""
            }`}
          >
            {message}
          </p>
        )}

        <div className="history-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All Looks ({outfits.length})
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
            Final ({finalCount})
          </button>
        </div>

        {loading ? (
          <div className="history-empty">
            Loading your outfits...
          </div>
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

              const processing =
                processingId !== null &&
                String(processingId) === String(id);

              const items = Array.isArray(outfit.items)
                ? outfit.items
                : [];

              const criteria = outfit.criteria ?? outfit;
              const coverImage = getOutfitCover(outfit);

              return (
                <article
                  className="history-card"
                  key={id ?? index}
                >
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

                    <span
                      className={`history-status ${
                        draft
                          ? "history-status-draft"
                          : "history-status-final"
                      }`}
                    >
                      {draft ? "✎ Draft" : "✓ Final"}
                    </span>

                    <span className="history-visibility">
                      {publicOutfit
                        ? "◉ Public"
                        : "♡ Private"}
                    </span>
                  </div>

                  <div className="history-card-content">
                    <h2>
                      {outfit.name ||
                        (draft
                          ? "Draft Outfit"
                          : "Final Outfit")}
                    </h2>

                    <p className="history-card-subtitle">
                      {items.length} fashion items
                    </p>

                    <div className="history-criteria">
                      <span>
                        Occasion: {criteria.case || "N/A"}
                      </span>
                      <span>
                        Style: {criteria.style || "N/A"}
                      </span>
                      <span>
                        Season: {criteria.season || "N/A"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="history-view-button"
                      onClick={() => setSelectedOutfit(outfit)}
                    >
                      <Eye size={17} />
                      View
                    </button>

                    <div className="history-card-actions">
                      {draft && (
                        <>
                          <button
                            type="button"
                            className="history-action-edit"
                            disabled={processingId !== null}
                            onClick={() => handleEditDraft(outfit)}
                          >
                            Edit Item
                          </button>

                          <button
                            type="button"
                            className="history-action-primary"
                            disabled={processingId !== null}
                            onClick={() => handleFinalize(outfit)}
                          >
                            {processing
                              ? "Processing..."
                              : "Finalize"}
                          </button>
                        </>
                      )}

                      {final && (
                        <button
                          type="button"
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
                        type="button"
                        className="history-action-delete"
                        disabled={processingId !== null}
                        onClick={() => setDeleteTarget(outfit)}
                      >
                        {processing
                          ? "Processing..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================
          EDIT MODAL
      ========================= */}

      {editingOutfit && (
        <div
          className="history-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEdit();
            }
          }}
        >
          <section
            className="history-modal history-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-edit-title"
          >
            <div className="history-modal-media history-edit-media">
              {getOutfitCover(editingOutfit) ? (
                <img
                  className="history-modal-image"
                  src={getOutfitCover(editingOutfit)}
                  alt={editingOutfit.name || "Outfit"}
                />
              ) : (
                <div className="history-modal-placeholder">
                  LOOKFIT
                </div>
              )}
            </div>

            <div className="history-modal-content history-edit-content">
              <button
                type="button"
                className="history-modal-close"
                aria-label="Close editor"
                onClick={closeEdit}
                disabled={editSaving}
              >
                <X size={21} />
              </button>

              <p className="history-modal-eyebrow">
                EDIT YOUR LOOK
              </p>

              <h2
                id="history-edit-title"
                className="history-modal-title"
              >
                {editingOutfit.name || "Draft Outfit"}
              </h2>

              <p className="history-edit-hint">
                Replace or remove items, then save your changes.
              </p>

              <div className="history-edit-scroll">
                <h3 className="history-edit-heading">
                  Current outfit items ({editingOutfit.items.length})
                </h3>

                <div className="history-edit-items">
                  {editingOutfit.items.map((item, index) => (
                    <div
                      className="history-edit-item"
                      key={`${getProductKey(item)}-${index}`}
                    >
                      <span>
                        {typeof item === "string"
                          ? item
                          : item?.name || `Item ${index + 1}`}

                        <small>
                          {" "}· {item?.category || "N/A"}
                        </small>
                      </span>

                      <button
                        type="button"
                        disabled={editSaving}
                        onClick={() => handleRemoveEditItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {editingOutfit.items.length === 0 && (
                    <p className="history-edit-empty">
                      No items selected.
                    </p>
                  )}
                </div>

                <h3 className="history-edit-heading">
                  Choose a replacement item
                </h3>

                <select
                  className="history-edit-select"
                  value={editCategory}
                  disabled={editSaving}
                  onChange={(event) => {
                    setEditCategory(event.target.value);
                    setEditPage(1);
                  }}
                  aria-label="Product category"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() +
                        category.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="history-edit-products">
                  {visibleEditProducts.map((product, index) => {
                    const selected = editingOutfit.items.some(
                      (item) =>
                        getProductKey(item) ===
                        getProductKey(product)
                    );

                    return (
                      <button
                        type="button"
                        className="history-edit-product"
                        key={`${getProductKey(product)}-${index}`}
                        disabled={selected || editSaving}
                        onClick={() => handleSelectEditItem(product)}
                      >
                        {getImage(product) ? (
                          <img
                            src={getImage(product)}
                            alt={product.name || "Product"}
                          />
                        ) : (
                          <span className="history-edit-product-placeholder">
                            No image
                          </span>
                        )}

                        <span>
                          {product.name || "Unnamed item"}
                        </span>

                        <small>
                          {selected ? "Selected" : "Select"}
                        </small>
                      </button>
                    );
                  })}

                  {editProducts.length === 0 && (
                    <p className="history-edit-empty">
                      No saved products in this category yet.
                    </p>
                  )}
                </div>

                {editTotalPages > 1 && (
                  <div className="history-edit-pages">
                    <button
                      type="button"
                      disabled={editPage <= 1 || editSaving}
                      onClick={() =>
                        setEditPage((page) => page - 1)
                      }
                    >
                      Previous
                    </button>

                    <span>
                      {editPage} / {editTotalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        editPage >= editTotalPages || editSaving
                      }
                      onClick={() =>
                        setEditPage((page) => page + 1)
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {editMessage && (
                <p className="history-edit-feedback" role="status">
                  {editMessage}
                </p>
              )}

              <div className="history-edit-footer">
                <button
                  type="button"
                  className="history-edit-cancel"
                  disabled={editSaving}
                  onClick={closeEdit}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="history-modal-button"
                  disabled={editSaving}
                  onClick={handleSaveEdit}
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =========================
          VIEW MODAL
      ========================= */}

      {selectedOutfit && (
        <div
          className="history-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOutfit(null);
            }
          }}
        >
          <section
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-preview-title"
          >
            <div className="history-modal-media">
              {previewImage ? (
                <img
                  className="history-modal-image"
                  src={previewImage}
                  alt={selectedOutfit.name || "Saved outfit"}
                />
              ) : (
                <div className="history-modal-placeholder">
                  LOOKFIT
                </div>
              )}
            </div>

            <div className="history-modal-content">
              <button
                type="button"
                className="history-modal-close"
                aria-label="Close outfit preview"
                onClick={() => setSelectedOutfit(null)}
              >
                <X size={21} />
              </button>

              <p className="history-modal-eyebrow">
                SAVED LOOK
              </p>

              <h2
                id="history-preview-title"
                className="history-modal-title"
              >
                {selectedOutfit.name || "Saved outfit"}
              </h2>

              {previewScore != null && (
                <p className="history-modal-score">
                  {String(previewScore).includes("%")
                    ? previewScore
                    : `${previewScore}%`}{" "}
                  match
                </p>
              )}

              <div className="history-modal-items">
                <h3>In this look</h3>

                {previewItems.length > 0 ? (
                  <ul>
                    {previewItems.map((item, index) => (
                      <li
                        key={
                          typeof item === "string"
                            ? index
                            : item?._id ?? item?.id ?? index
                        }
                      >
                        {typeof item === "string"
                          ? item
                          : item?.name ||
                            item?.category ||
                            `Item ${index + 1}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No items available.</p>
                )}
              </div>

              {previewDate && (
                <p className="history-modal-date">
                  Saved {previewDate}
                </p>
              )}

              <button
                type="button"
                className="history-modal-button"
                onClick={() => {
                  setSelectedOutfit(null);
                  navigate("/recommendation");
                }}
              >
                Find a similar look
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="history-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && processingId === null) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="history-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-delete-title"
            aria-describedby="history-delete-description"
          >
            <div className="history-delete-icon">
              <Trash2 size={28} strokeWidth={1.8} />
            </div>
            <h2 id="history-delete-title">Delete this outfit?</h2>
            <p id="history-delete-description">
              Are you sure you want to remove this outfit from your history?
              This action cannot be undone.
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
                {processingId !== null ? "Deleting..." : "Delete Now"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
