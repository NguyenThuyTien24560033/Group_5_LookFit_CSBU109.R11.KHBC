import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getOutfitById,
  updateDraftItems,
} from "../../services/outfit.service.js";

import { getCatalogProducts } from "../../services/catalog.service.js";

import "./OutfitEdit.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CATEGORIES = ["top", "bottom", "shoes", "accessory"];

function getId(value) {
  return value?._id ?? value?.id ?? value;
}

function getCatalogId(item) {
  return getId(item?.catalogId) ?? getId(item);
}

function getItemKey(item, index) {
  return String(
    item?._id ??
    item?.id ??
    item?.catalogId ??
    index
  );
}

function getImageUrl(item) {
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

function OutfitEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [outfit, setOutfit] = useState(null);
  const [category, setCategory] = useState("top");
  const [products, setProducts] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalProducts: 0,
    totalPages: 0,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [outfitLoaded, setOutfitLoaded] = useState(false);

  const showError = (error, fallback) => {
    setIsError(true);
    setMessage(error?.message || fallback);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOutfit() {
      setLoading(true);
      setMessage("");
      setIsError(false);
      setOutfitLoaded(false);

      try {
        const result = await getOutfitById(id);
        const currentOutfit = result?.outfit ?? result?.data ?? result;

        if (cancelled) return;

        if (!currentOutfit || currentOutfit.status !== "DRAFT") {
          setMessage("Only Draft outfits can be edited.");
          setIsError(true);
          return;
        }

        setOutfit({
          ...currentOutfit,
          items: currentOutfit.items ?? [],
        });

        const firstCategory = CATEGORIES.find((itemCategory) =>
          currentOutfit.items?.some(
            (item) => item.category === itemCategory
          )
        );

        if (firstCategory) {
          setCategory(firstCategory);
        }

        setOutfitLoaded(true);
      } catch (error) {
        if (!cancelled) {
          showError(error, "Unable to load outfit.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOutfit();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setProductsLoading(true);
      setMessage("");
      setIsError(false);

      try {
        const result = await getCatalogProducts({
          category,
          page: pagination.page,
          pageSize: 10,
        });

        if (cancelled) return;

        setProducts(result.products ?? []);

        setPagination((current) => ({
          ...current,
          ...(result.pagination ?? {}),
          page: result.pagination?.page ?? current.page,
          pageSize: 10,
        }));
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          showError(error, "Unable to load catalog products.");
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [category, pagination.page]);

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;

    setCategory(nextCategory);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleSelectProduct = (product) => {
    if (!outfit || saving) return;

    const productId = getId(product);

    if (!productId) {
      setIsError(true);
      setMessage("The selected product has no valid ID.");
      return;
    }

    const selectedItem = {
      ...product,
      catalogId: String(productId),
    };

    const currentItems = outfit.items ?? [];
    const existingIndex = currentItems.findIndex(
      (item) => item.category === product.category
    );

    let updatedItems;

    if (existingIndex >= 0) {
      updatedItems = currentItems.map((item, index) =>
        index === existingIndex
          ? selectedItem
          : item
      );
    } else {
      updatedItems = [...currentItems, selectedItem];
    }

    setOutfit((current) => ({
      ...current,
      items: updatedItems,
    }));

    setMessage(`${product.name} selected.`);
    setIsError(false);
  };

  const handleRemoveItem = (itemToRemove) => {
    if (!outfit || saving) return;

    const removeId = getCatalogId(itemToRemove);

    setOutfit((current) => ({
      ...current,
      items: (current.items ?? []).filter((item) => {
        return String(getCatalogId(item)) !== String(removeId);
      }),
    }));

    setMessage("Item removed from the draft.");
    setIsError(false);
  };

  const handleSave = async () => {
    if (!outfit || saving) return;

    const items = (outfit.items ?? []).map((item) => ({
      id: String(getCatalogId(item) ?? ""),
    }));

    if (items.length === 0 || items.some((item) => !item.id)) {
      setIsError(true);
      setMessage("Your outfit must contain valid catalog items.");
      return;
    }

    const ids = items.map((item) => item.id);

    if (new Set(ids).size !== ids.length) {
      setIsError(true);
      setMessage("An item cannot be selected more than once.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      await updateDraftItems(id, items);

      navigate("/outfits/history", {
        replace: true,
        state: {
          message: "Draft updated successfully.",
        },
      });
    } catch (error) {
      showError(error, "Unable to save outfit changes.");
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (nextPage) => {
    if (
      productsLoading ||
      saving ||
      nextPage < 1 ||
      nextPage === pagination.page
    ) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  };

  if (loading) {
    return (
      <main className="outfit-edit-page">
        <p className="outfit-edit-loading">Loading outfit...</p>
      </main>
    );
  }

  if (!outfit) {
    return (
      <main className="outfit-edit-page">
        <section className="outfit-edit-empty">
          <h1>Edit Draft Outfit</h1>

          <p className="outfit-edit-message outfit-edit-message--error">
            {message || "Outfit not found."}
          </p>

          <button
            type="button"
            className="outfit-edit-button"
            onClick={() => navigate("/outfits/history")}
          >
            Back to History
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="outfit-edit-page">
      <header className="outfit-edit-header">
        <div>
          <h1>Edit Draft Outfit</h1>
          <p>
            Replace or remove items, then save your changes.
          </p>
        </div>

        <span className="outfit-edit-status">DRAFT</span>
      </header>

      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`outfit-edit-message ${
            isError ? "outfit-edit-message--error" : ""
          }`}
        >
          {message}
        </p>
      )}

      <section className="outfit-edit-section">
        <div className="outfit-edit-section-header">
          <div>
            <h2>Current outfit items</h2>
            <p>Items currently included in this draft.</p>
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
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="outfit-edit-image-placeholder">
                      No image
                    </div>
                  )}

                  <div className="outfit-edit-item-info">
                    <h3>{item.name || "Unnamed item"}</h3>
                    <p>Category: {item.category || "N/A"}</p>
                    <p>Color: {item.color || "N/A"}</p>

                    <button
                      type="button"
                      className="outfit-edit-button outfit-edit-button--remove"
                      onClick={() => handleRemoveItem(item)}
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
            No items selected. Choose products below before saving.
          </p>
        )}
      </section>

      <section className="outfit-edit-section">
        <div className="outfit-edit-section-header">
          <div>
            <h2>Choose a replacement item</h2>
            <p>
              Select a category to browse available catalog products.
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
            {CATEGORIES.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory}
              </option>
            ))}
          </select>
        </div>

        {productsLoading ? (
          <p className="outfit-edit-loading">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="outfit-edit-empty">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className="outfit-edit-product-grid">
            {products.map((product, index) => {
              const productId = getId(product);
              const imageUrl = getImageUrl(product);

              const alreadySelected = (outfit.items ?? []).some(
                (item) =>
                  String(getCatalogId(item)) === String(productId)
              );

              return (
                <article
                  className="outfit-edit-product-card"
                  key={productId ?? index}
                >
                  {imageUrl ? (
                    <img
                      className="outfit-edit-product-image"
                      src={imageUrl}
                      alt={product.name || "Catalog product"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="outfit-edit-product-placeholder">
                      No image available
                    </div>
                  )}

                  <div className="outfit-edit-product-info">
                    <h3>{product.name || "Unnamed product"}</h3>
                    <p>Category: {product.category || "N/A"}</p>
                    <p>Color: {product.color || "N/A"}</p>

                    <button
                      type="button"
                      className="outfit-edit-button outfit-edit-button--select"
                      onClick={() => handleSelectProduct(product)}
                      disabled={saving || alreadySelected || !productId}
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

        <nav
          className="outfit-edit-pagination"
          aria-label="Catalog product pages"
        >
          <button
            type="button"
            className="outfit-edit-button"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={
              productsLoading ||
              saving ||
              pagination.page <= 1
            }
          >
            Previous
          </button>

          <span>
            Page {pagination.page}
            {pagination.totalPages > 0
              ? ` of ${pagination.totalPages}`
              : ""}
          </span>

          <button
            type="button"
            className="outfit-edit-button"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={
              productsLoading ||
              saving ||
              !pagination.hasNextPage
            }
          >
            Next
          </button>
        </nav>
      </section>

      <footer className="outfit-edit-footer">
        <button
          type="button"
          className="outfit-edit-button outfit-edit-button--primary"
          onClick={handleSave}
          disabled={saving || productsLoading || !outfitLoaded}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          className="outfit-edit-button"
          onClick={() => navigate("/outfits/history")}
          disabled={saving}
        >
          Cancel
        </button>
      </footer>
    </main>
  );
}

export default OutfitEdit;