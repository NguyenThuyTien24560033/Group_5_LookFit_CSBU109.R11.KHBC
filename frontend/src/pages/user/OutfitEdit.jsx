import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  getOutfitById,
  updateDraftItems,
} from "../../services/outfit.service.js";

import { getCatalogProducts } from "../../services/catalog.service.js";

import "./OutfitEdit.css";

// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://group-5-lookfit-csbu109-r11-khbc.onrender.com/api";


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
    pageSize: 12,
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

  // Tải outfit hiện tại từ Database
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

  // Tải danh mục sản phẩm từ kho catalog theo category đã chọn
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
          pageSize: 12,
        });

        if (cancelled) return;

        setProducts(result.products ?? []);

        setPagination((current) => ({
          ...current,
          ...(result.pagination ?? {}),
          page: result.pagination?.page ?? current.page,
          pageSize: 12,
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
        index === existingIndex ? selectedItem : item
      );
    } else {
      updatedItems = [...currentItems, selectedItem];
    }

    setOutfit((current) => ({
      ...current,
      items: updatedItems,
    }));

    setIsError(false);
    setMessage(`Selected "${product.name || "item"}" for ${product.category}.`);
  };

  const handleRemoveItem = (itemToRemove) => {
    if (!outfit || saving) return;

    const removeId = getCatalogId(itemToRemove);
    const updatedItems = (outfit.items ?? []).filter(
      (item) => String(getCatalogId(item)) !== String(removeId)
    );

    setOutfit((current) => ({
      ...current,
      items: updatedItems,
    }));

    setIsError(false);
    setMessage(`Removed item from draft.`);
  };

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      productsLoading ||
      saving
    ) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  };

  const handleSave = async () => {
    if (!outfit || saving || !outfitLoaded) return;

    const currentItems = outfit.items ?? [];
    if (currentItems.length === 0) {
      setIsError(true);
      setMessage("Your outfit must contain at least one item before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const itemsPayload = currentItems.map((item) => {
        const catalogId = getCatalogId(item);
        return { id: String(catalogId) };
      });

      await updateDraftItems(id, itemsPayload);

      navigate("/outfits/history", {
        replace: true,
        state: {
          message: "Outfit draft updated successfully.",
        },
      });
    } catch (error) {
      showError(error, "Unable to save outfit changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="outfit-edit-page">
        <p className="outfit-edit-loading">Loading outfit details...</p>
      </main>
    );
  }

  return (
    <main className="outfit-edit-page">
      <header className="outfit-edit-header">
        <Link to="/outfits/history" className="lookfit-page-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8a756f", textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to History
        </Link>
        <h1>Edit Draft Outfit</h1>
        <p>Swap items in your draft look with other available pieces.</p>

        {message && (
          <p
            className={`outfit-edit-message ${
              isError
                ? "outfit-edit-message--error"
                : "outfit-edit-message--success"
            }`}
            role={isError ? "alert" : "status"}
          >
            {message}
          </p>
        )}
      </header>

      {/* ITEMS HIỆN CÓ TRONG OUTFIT */}
      <section className="outfit-edit-section">
        <h2>Current Outfit Items</h2>

        {outfit?.items?.length ? (
          <div className="outfit-edit-current-grid">
            {outfit.items.map((item, index) => {
              const imageUrl = getImageUrl(item);
              const itemKey = getItemKey(item, index);

              return (
                <article
                  className="outfit-edit-current-card"
                  key={itemKey}
                >
                  {imageUrl ? (
                    <img
                      className="outfit-edit-current-image"
                      src={imageUrl}
                      alt={item.name || "Outfit item"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="outfit-edit-current-placeholder">
                      {item.category?.toUpperCase() || "ITEM"}
                    </div>
                  )}

                  <div className="outfit-edit-current-info">
                    <h3>{item.name || "Unnamed item"}</h3>
                    <p style={{ textTransform: "capitalize" }}>Category: {item.category || "N/A"}</p>
                    {item.color && <p>Color: {item.color}</p>}

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

      {/* CHỌN MÓN ĐỒ THAY THẾ TỪ CATALOG */}
      <section className="outfit-edit-section">
        <div className="outfit-edit-section-header">
          <div>
            <h2>Choose a replacement item</h2>
            <p>Select a category to browse available catalog products.</p>
          </div>
        </div>

        <div className="outfit-edit-filter">
          <label htmlFor="outfit-edit-category">Product category:</label>
          <select
            id="outfit-edit-category"
            value={category}
            onChange={handleCategoryChange}
            disabled={saving}
          >
            {CATEGORIES.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory.toUpperCase()}
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
                (item) => String(getCatalogId(item)) === String(productId)
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
                    <p style={{ textTransform: "capitalize" }}>Category: {product.category || "N/A"}</p>
                    <p>Color: {product.color || "N/A"}</p>

                    <button
                      type="button"
                      className="outfit-edit-button outfit-edit-button--select"
                      onClick={() => handleSelectProduct(product)}
                      disabled={saving || alreadySelected || !productId}
                    >
                      {alreadySelected ? "Selected" : "Select item"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <nav className="outfit-edit-pagination">
            <button
              type="button"
              className="outfit-edit-button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={productsLoading || saving || pagination.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="outfit-edit-button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={productsLoading || saving || !pagination.hasNextPage}
            >
              Next
            </button>
          </nav>
        )}
      </section>

      <footer className="outfit-edit-footer" style={{ marginTop: 30, display: "flex", gap: 12 }}>
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