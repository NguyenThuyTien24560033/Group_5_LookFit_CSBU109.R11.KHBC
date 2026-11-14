
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./OutfitEdit.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const STORAGE_KEY = "lookfit_preview_outfits";
const CATEGORIES = ["top", "bottom", "shoes", "accessory"];
const PAGE_SIZE = 10;

// =========================
// HELPERS
// =========================

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

function getId(value) {
  if (value == null) return null;

  if (typeof value === "object") {
    return value._id ?? value.id ?? value.outfitId ?? null;
  }

  return value;
}

function normalizeCategory(value) {
  const category = String(value || "")
    .trim()
    .toLowerCase();

  if (category === "accessories") return "accessory";

  return category;
}

function getCatalogId(item) {
  return getId(item?.catalogId) ?? getId(item);
}

function getProductKey(item) {
  const id = getCatalogId(item);

  if (id != null && String(id) !== "") {
    return String(id);
  }

  return [
    String(item?.name || "").trim().toLowerCase(),
    normalizeCategory(item?.category),
    String(item?.color || "").trim().toLowerCase(),
  ].join("|");
}

function getItemKey(item, index) {
  return `${getProductKey(item)}-${index}`;
}

function getImageUrl(item) {
  if (!item) return "";

  if (
    typeof item.imageUrl === "string" &&
    item.imageUrl.trim()
  ) {
    return item.imageUrl.trim();
  }

  const imageId = getId(item.imageId);

  return imageId
    ? `${API_BASE_URL}/images/${imageId}`
    : "";
}

function isDraft(outfit) {
  return (
    String(outfit?.status || "DRAFT").toUpperCase() ===
    "DRAFT"
  );
}

// =========================
// COMPONENT
// =========================

export default function OutfitEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [outfit, setOutfit] = useState(null);
  const [category, setCategory] = useState("top");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // =========================
  // LOAD DRAFT
  // =========================

  useEffect(() => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    const saved = readPreview();

    const found = saved.find(
      (entry) =>
        String(getId(entry)) === String(id)
    );

    if (!found || !isDraft(found)) {
      setOutfit(null);
      setIsError(true);
      setMessage(
        "Draft outfit not found or already finalized."
      );
    } else {
      setOutfit({
        ...found,
        items: Array.isArray(found.items)
          ? [...found.items]
          : [],
      });

      const firstCategory = CATEGORIES.find((cat) =>
        found.items?.some(
          (item) =>
            normalizeCategory(item.category) === cat
        )
      );

      setCategory(firstCategory || "top");
      setPage(1);
    }

    setLoading(false);
  }, [id]);

  // =========================
  // BUILD PREVIEW CATALOG
  // =========================

  const catalog = useMemo(() => {
    const unique = new Map();

    readPreview().forEach((entry) => {
      (entry.items ?? []).forEach((item) => {
        if (!item || typeof item !== "object") return;

        const productCategory = normalizeCategory(
          item.category
        );

        if (!productCategory) return;

        const key = `${productCategory}:${getProductKey(item)}`;

        if (!unique.has(key)) {
          unique.set(key, item);
        }
      });
    });

    return [...unique.values()];
  }, [id]);

  const products = useMemo(() => {
    return catalog.filter(
      (item) =>
        normalizeCategory(item.category) === category
    );
  }, [catalog, category]);

  const totalPages = Math.ceil(
    products.length / PAGE_SIZE
  );

  const visibleProducts = products.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // =========================
  // CATEGORY
  // =========================

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  // =========================
  // SELECT PRODUCT
  // =========================

  const handleSelectProduct = (product) => {
    if (!outfit || saving) return;

    const selectedItem = { ...product };

    const currentItems = outfit.items ?? [];

    const existingIndex = currentItems.findIndex(
      (item) =>
        normalizeCategory(item.category) ===
        normalizeCategory(product.category)
    );

    const updatedItems =
      existingIndex >= 0
        ? currentItems.map((item, index) =>
            index === existingIndex
              ? selectedItem
              : item
          )
        : [...currentItems, selectedItem];

    setOutfit((current) => ({
      ...current,
      items: updatedItems,
    }));

    setMessage(
      `${product.name || "Product"} selected.`
    );
    setIsError(false);
  };

  // =========================
  // REMOVE ITEM
  // =========================

  const handleRemoveItem = (indexToRemove) => {
    if (!outfit || saving) return;

    setOutfit((current) => ({
      ...current,
      items: (current.items ?? []).filter(
        (_, index) => index !== indexToRemove
      ),
    }));

    setMessage("Item removed from the draft.");
    setIsError(false);
  };

  // =========================
  // SAVE CHANGES
  // =========================

  const handleSave = () => {
    if (!outfit || saving) return;

    if (!outfit.items?.length) {
      setIsError(true);
      setMessage(
        "Your outfit must contain at least one item."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const saved = readPreview();

      const index = saved.findIndex(
        (entry) =>
          String(getId(entry)) === String(id)
      );

      if (
        index === -1 ||
        !isDraft(saved[index])
      ) {
        throw new Error(
          "Draft no longer exists or has been finalized."
        );
      }

      saved[index] = {
        ...saved[index],
        items: outfit.items,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(saved)
      );

      navigate("/outfits/history", {
        replace: true,
        state: {
          message: "Draft updated successfully.",
        },
      });
    } catch (error) {
      setIsError(true);
      setMessage(
        error?.message ||
          "Unable to save outfit changes."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING / NOT FOUND
  // =========================

  if (loading) {
    return (
      <main className="outfit-edit-page">
        <p className="outfit-edit-loading">
          Loading outfit...
        </p>
      </main>
    );
  }

  if (!outfit) {
    return (
      <main className="outfit-edit-page">
        <section className="outfit-edit-empty">
          <h1>Edit Draft Outfit</h1>

          <p className="outfit-edit-message outfit-edit-message--error">
            {message}
          </p>

          <button
            type="button"
            className="outfit-edit-button"
            onClick={() =>
              navigate("/outfits/history")
            }
          >
            Back to History
          </button>
        </section>
      </main>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <main className="outfit-edit-page">

      <header className="outfit-edit-header">
        <div>
          <h1>Edit Draft Outfit</h1>

          <p>
            Replace or remove items, then save
            your changes.
          </p>
        </div>

        <span className="outfit-edit-status">
          DRAFT
        </span>
      </header>

      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`outfit-edit-message ${
            isError
              ? "outfit-edit-message--error"
              : ""
          }`}
        >
          {message}
        </p>
      )}

      {/* CURRENT ITEMS */}
      <section className="outfit-edit-section">
        <div className="outfit-edit-section-header">
          <div>
            <h2>Current outfit items</h2>
            <p>
              Items currently included in this draft.
            </p>
          </div>

          <span className="outfit-edit-count">
            {outfit.items?.length ?? 0} items
          </span>
        </div>

        {outfit.items?.length ? (
          <div className="outfit-edit-current-list">
            {outfit.items.map((item, index) => {
              const imageUrl = getImageUrl(item);

              return (
                <article
                  className="outfit-edit-current-item"
                  key={getItemKey(item, index)}
                >
                  {imageUrl ? (
                    <img
                      className="outfit-edit-image"
                      src={imageUrl}
                      alt={item.name || "Outfit item"}
                    />
                  ) : (
                    <div className="outfit-edit-image-placeholder">
                      No image
                    </div>
                  )}

                  <div className="outfit-edit-item-info">
                    <h3>
                      {item.name || "Unnamed item"}
                    </h3>

                    <p>
                      Category: {item.category || "N/A"}
                    </p>

                    <p>
                      Color: {item.color || "N/A"}
                    </p>

                    <button
                      type="button"
                      className="outfit-edit-button outfit-edit-button--remove"
                      onClick={() =>
                        handleRemoveItem(index)
                      }
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="outfit-edit-empty-text">
            No items selected. Choose products
            below before saving.
          </p>
        )}
      </section>

      {/* REPLACEMENT PRODUCTS */}
      <section className="outfit-edit-section">
        <div className="outfit-edit-section-header">
          <div>
            <h2>Choose a replacement item</h2>

            <p>
              Select a category to browse available
              products.
            </p>
          </div>
        </div>

        <div className="outfit-edit-filter">
          <label htmlFor="outfit-edit-category">
            Product category
          </label>

          <select
            id="outfit-edit-category"
            value={category}
            onChange={handleCategoryChange}
            disabled={saving}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="outfit-edit-empty">
            <p>
              No products found in this category.
            </p>
          </div>
        ) : (
          <div className="outfit-edit-product-grid">
            {visibleProducts.map((product, index) => {
              const imageUrl = getImageUrl(product);

              const alreadySelected = (
                outfit.items ?? []
              ).some(
                (item) =>
                  normalizeCategory(item.category) ===
                    normalizeCategory(product.category) &&
                  getProductKey(item) ===
                    getProductKey(product)
              );

              return (
                <article
                  className="outfit-edit-product-card"
                  key={`${getProductKey(product)}-${index}`}
                >
                  {imageUrl ? (
                    <img
                      className="outfit-edit-product-image"
                      src={imageUrl}
                      alt={product.name || "Product"}
                    />
                  ) : (
                    <div className="outfit-edit-product-placeholder">
                      No image available
                    </div>
                  )}

                  <div className="outfit-edit-product-info">
                    <h3>
                      {product.name || "Unnamed product"}
                    </h3>

                    <p>
                      Category: {product.category || "N/A"}
                    </p>

                    <p>
                      Color: {product.color || "N/A"}
                    </p>

                    <button
                      type="button"
                      className="outfit-edit-button outfit-edit-button--select"
                      onClick={() =>
                        handleSelectProduct(product)
                      }
                      disabled={saving || alreadySelected}
                    >
                      {alreadySelected
                        ? "Selected"
                        : "Select item"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        <nav
          className="outfit-edit-pagination"
          aria-label="Catalog product pages"
        >
          <button
            type="button"
            className="outfit-edit-button"
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            disabled={saving || page <= 1}
          >
            Previous
          </button>

          <span>
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            className="outfit-edit-button"
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            disabled={
              saving ||
              page >= totalPages
            }
          >
            Next
          </button>
        </nav>
      </section>

      {/* SAVE / CANCEL */}
      <footer className="outfit-edit-footer">
        <button
          type="button"
          className="outfit-edit-button outfit-edit-button--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

        <button
          type="button"
          className="outfit-edit-button"
          onClick={() =>
            navigate("/outfits/history")
          }
          disabled={saving}
        >
          Cancel
        </button>
      </footer>
    </main>
  );
}
