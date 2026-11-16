import { useEffect, useMemo, useState } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  uploadAdminImage,
} from "../../services/admin.service.js";
import api from "../../services/api.js";
import "./Catalog.css";

const PAGE_SIZE = 9;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Danh sách 13 màu chuẩn theo thuật toán phối màu của LookFit
const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "beige", label: "Beige" },
  { value: "brown", label: "Brown" },
  { value: "navy", label: "Navy" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
];

const EMPTY_PRODUCT = {
  category: "top",
  name: "",
  color: "",
  imageId: null,
  imageUrl: "",
  cases: [],
  styles: [],
  seasons: [],
  weathers: [],
  shapes: [],
  lifestyles: [],
  isActive: true,
};

const ARRAY_FIELDS = [
  {
    key: "cases",
    label: "Occasions",
    options: [
      "casual",
      "daily",
      "school",
      "work",
      "business",
      "party",
      "date",
      "wedding",
      "travel",
      "sport",
      "formal",
    ],
  },
  {
    key: "styles",
    label: "Styles",
    options: [
      "basic",
      "minimal",
      "minimalist",
      "smart-casual",
      "street",
      "streetwear",
      "vintage",
      "preppy",
      "sporty",
      "chic",
      "classic",
      "elegant",
      "bohemian",
      "old-money",
      "y2k",
      "coquette",
      "grunge",
    ],
  },
  {
    key: "seasons",
    label: "Seasons",
    options: ["spring", "summer", "autumn", "winter"],
  },
  {
    key: "weathers",
    label: "Weather",
    options: [
      "hot",
      "warm",
      "mild",
      "cool",
      "cold",
      "rainy",
      "windy",
      "humid",
    ],
  },
  {
    key: "shapes",
    label: "Body Shapes",
    options: [
      "hourglass",
      "pear",
      "inverted-triangle",
      "rectangle",
      "apple",
    ],
  },
  {
    key: "lifestyles",
    label: "Lifestyles",
    options: [
      "student",
      "daily",
      "office",
      "active",
      "relaxed",
      "travel",
      "outdoor",
      "social",
      "work-from-home",
    ],
  },
];

const CATEGORIES = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory", label: "Accessory" },
];

function getProductId(product) {
  return product?._id ?? product?.id;
}

function getImageId(product) {
  const value = product?.imageId;

  if (!value) return null;

  if (typeof value === "object") {
    return value._id ?? value.id ?? null;
  }

  return String(value);
}

function getProductImageUrl(product) {
  const imageId = getImageId(product);

  if (imageId) {
    
    const baseURL = (
      api.defaults.baseURL || "https://group-5-lookfit-csbu109-r11-khbc.onrender.com/api"
    ).replace(/\/+$/, "");
    // const baseURL = (
    //   api.defaults.baseURL || "http://localhost:3000/api"
    // ).replace(/\/+$/, "");

    return `${baseURL}/images/${imageId}`;
  }

  return product?.imageUrl?.trim() || "";
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [showForm, setShowForm] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function loadProducts(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAdminProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name?.toLowerCase().includes(keyword) ||
        product.color?.toLowerCase().includes(keyword) ||
        String(getProductId(product) ?? "")
          .toLowerCase()
          .includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.isActive !== false) ||
        (statusFilter === "inactive" && product.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setImagePreview("");
  }

  function toggleArrayValue(field, value) {
    setForm((previous) => {
      const current = previous[field] ?? [];

      return {
        ...previous,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  }

  function startCreate() {
    clearSelectedImage();
    setForm({ ...EMPTY_PRODUCT });
    setEditingId(null);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function startEdit(product) {
    clearSelectedImage();

    const imageId = getImageId(product);

    setForm({
      category: product.category ?? "top",
      name: product.name ?? "",
      color: (product.color ?? "").trim().toLowerCase(),
      imageId,
      imageUrl: product.imageUrl ?? "",
      cases: [...(product.cases ?? [])],
      styles: [...(product.styles ?? [])],
      seasons: [...(product.seasons ?? [])],
      weathers: [...(product.weathers ?? [])],
      shapes: [...(product.shapes ?? [])],
      lifestyles: [...(product.lifestyles ?? [])],
      isActive: product.isActive !== false,
    });

    setImagePreview(getProductImageUrl(product));
    setEditingId(getProductId(product));
    setShowForm(true);
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    clearSelectedImage();
    setForm({ ...EMPTY_PRODUCT });
    setEditingId(null);
    setShowForm(false);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      return;
    }

    setError("");
    setNotice("");

    clearSelectedImage();
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    // A newly selected local image replaces the existing image source.
    setForm((previous) => ({
      ...previous,
      imageId: null,
      imageUrl: "",
    }));
  }

  function handleImageUrlChange(value) {
    setForm((previous) => ({
      ...previous,
      imageUrl: value,
      imageId: value.trim() ? null : previous.imageId,
    }));

    if (value.trim()) {
      clearSelectedImage();
      setImagePreview(value.trim());
    } else if (!selectedImage) {
      setImagePreview("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.name.trim() || !form.color.trim()) {
      setError("Please enter the product name and color.");
      return;
    }

    if (form.imageUrl.trim()) {
      try {
        const url = new URL(form.imageUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError("Invalid image URL. Please enter a valid HTTP or HTTPS URL.");
        return;
      }
    }

    setSaving(true);

    let payload = {
      ...form,
      name: form.name.trim(),
      color: form.color.trim().toLowerCase(),
      imageId: form.imageId || null,
      imageUrl: form.imageUrl.trim() || null,
    };

    try {
      if (selectedImage) {
        setUploadingImage(true);

        const uploadedImage = await uploadAdminImage(selectedImage);

        if (!uploadedImage?.imageId) {
          throw new Error(
            "Image upload did not return an image ID."
          );
        }

        payload = {
          ...payload,
          imageId: uploadedImage.imageId,
          imageUrl: null,
        };
      }

      if (editingId) {
        await updateAdminProduct(editingId, payload);
        setNotice("Product updated successfully.");
      } else {
        await createAdminProduct(payload);
        setNotice("Product created successfully.");
      }

      resetForm();
      await loadProducts(false);
      setPage(1);
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save the product.")
      );
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  async function handleToggleActive(product) {
    const productId = getProductId(product);

    if (!productId) {
      setError("Product ID could not be found.");
      return;
    }

    const nextStatus = product.isActive === false;

    const confirmed = window.confirm(
      nextStatus
        ? `Reactivate "${product.name}"?`
        : `Deactivate "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setTogglingId(productId);

    try {
      await updateAdminProduct(productId, {
        isActive: nextStatus,
      });

      setNotice(
        nextStatus
          ? "Product reactivated successfully."
          : "Product deactivated successfully."
      );

      await loadProducts(false);
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to update the product status.")
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <div>
          <h1>Catalog Management</h1>
          <p>
            Manage the products used by the LFit outfit recommendation system.
          </p>
        </div>

        <button
          type="button"
          className="catalog-button catalog-button--primary"
          onClick={startCreate}
          disabled={saving}
        >
          + Add Product
        </button>
      </header>

      {error && (
        <p className="catalog-message catalog-message--error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p
          className="catalog-message catalog-message--success"
          role="status"
        >
          {notice}
        </p>
      )}

      {showForm && (
        <section className="catalog-form-section">
          <div className="catalog-section-header">
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

            <button
              type="button"
              className="catalog-button"
              onClick={resetForm}
              disabled={saving}
            >
              Close
            </button>
          </div>

          <form className="catalog-form" onSubmit={handleSubmit}>
            <div className="catalog-field">
              <label htmlFor="product-name">Product Name *</label>
              <input
                id="product-name"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="e.g. White Basic T-Shirt"
                maxLength={150}
                required
              />
            </div>

            <div className="catalog-field">
              <label htmlFor="product-category">Category *</label>
              <select
                id="product-category"
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                required
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECTION CHO MÀU SẮC */}
            <div className="catalog-field">
              <label htmlFor="product-color">Color *</label>
              <select
                id="product-color"
                value={form.color}
                onChange={(event) =>
                  updateField("color", event.target.value)
                }
                required
              >
                <option value="" disabled>
                  Select a color
                </option>
                {COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
                {/* Giữ lại màu cũ nếu trước đây từng lưu màu tùy biến chưa nằm trong danh sách chuẩn */}
                {form.color &&
                  !COLORS.some((c) => c.value === form.color.toLowerCase()) && (
                    <option value={form.color.toLowerCase()}>
                      {form.color}
                    </option>
                  )}
              </select>
            </div>

            <div className="catalog-field">
              <label htmlFor="product-image-file">
                Upload Image (JPEG, PNG, WebP; max 5 MB)
              </label>

              <input
                id="product-image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={saving}
              />
            </div>

            <div className="catalog-field">
              <label htmlFor="product-image-url">
                Or use an Image URL
              </label>

              <input
                id="product-image-url"
                type="url"
                value={form.imageUrl}
                onChange={(event) =>
                  handleImageUrlChange(event.target.value)
                }
                placeholder="https://example.com/image.jpg"
                disabled={Boolean(selectedImage) || saving}
              />
            </div>

            {imagePreview && (
              <div className="catalog-image-preview">
                <p className="catalog-field-label">Image Preview</p>

                <img
                  src={imagePreview}
                  alt={form.name || "Product preview"}
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.visibility = "visible";
                  }}
                />

                {selectedImage && (
                  <p>
                    Selected file: {selectedImage.name}
                  </p>
                )}
              </div>
            )}

            <div className="catalog-compatibility">
              <h3>Compatibility Criteria</h3>
              <p>
                Select the criteria that apply to this product. You can select
                multiple values in each group.
              </p>

              {ARRAY_FIELDS.map(({ key, label, options }) => (
                <fieldset className="catalog-checkbox-group" key={key}>
                  <legend>{label}</legend>

                  <div className="catalog-checkbox-options">
                    {options.map((option) => (
                      <label key={option}>
                        <input
                          type="checkbox"
                          checked={(form[key] ?? []).includes(option)}
                          onChange={() => toggleArrayValue(key, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <label className="catalog-active-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateField("isActive", event.target.checked)
                }
              />
              <span>Product is active</span>
            </label>

            <div className="catalog-form-actions">
              <button
                type="submit"
                className="catalog-button catalog-button--primary"
                disabled={saving}
              >
                {uploadingImage
                  ? "Uploading image..."
                  : saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Product"}
              </button>

              <button
                type="button"
                className="catalog-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="catalog-list-section">
        <div className="catalog-section-header">
          <div>
            <h2>Product List</h2>
            <p className="catalog-muted">
              {filteredProducts.length} product(s) found
            </p>
          </div>

          <button
            type="button"
            className="catalog-button"
            onClick={() => loadProducts()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="catalog-toolbar">
          <div className="catalog-field">
            <label htmlFor="catalog-search">Search</label>
            <input
              id="catalog-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, color, or ID..."
            />
          </div>

          <div className="catalog-field">
            <label htmlFor="catalog-category-filter">Category</label>
            <select
              id="catalog-category-filter"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-field">
            <label htmlFor="catalog-status-filter">Status</label>
            <select
              id="catalog-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="catalog-empty-state">Loading products...</div>
        ) : paginatedProducts.length === 0 ? (
          <div className="catalog-empty-state">
            No matching products found.
          </div>
        ) : (
          <>
            <div className="catalog-product-grid">
              {paginatedProducts.map((product, index) => {
                const productId = getProductId(product);
                const isActive = product.isActive !== false;
                const imageUrl = getProductImageUrl(product);

                return (
                  <article
                    className="catalog-product-card"
                    key={productId ?? `${product.name}-${index}`}
                  >
                    <div className="catalog-product-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name || "Product"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>No image available</span>
                      )}
                    </div>

                    <div className="catalog-product-content">
                      <h3>{product.name || "Unnamed Product"}</h3>

                      <p>
                        <strong>Category:</strong>{" "}
                        {product.category || "—"}
                      </p>

                      <p>
                        <strong>Color:</strong> {product.color || "—"}
                      </p>

                      <p className="catalog-product-id">
                        <strong>ID:</strong> {productId || "—"}
                      </p>

                      <span
                        className={`catalog-status ${
                          isActive
                            ? "catalog-status--active"
                            : "catalog-status--inactive"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="catalog-product-actions">
                      <button
                        type="button"
                        className="catalog-button"
                        onClick={() => startEdit(product)}
                        disabled={!productId || saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="catalog-button"
                        onClick={() => handleToggleActive(product)}
                        disabled={!productId || togglingId === productId}
                      >
                        {togglingId === productId
                          ? "Processing..."
                          : isActive
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <nav
              className="catalog-pagination"
              aria-label="Product pagination"
            >
              <button
                type="button"
                className="catalog-button"
                disabled={currentPage <= 1}
                onClick={() => setPage((previous) => previous - 1)}
              >
                ← Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="catalog-button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((previous) => previous + 1)}
              >
                Next →
              </button>
            </nav>

            <p className="catalog-pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </p>
          </>
        )}
      </section>
    </main>
  );
}