import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCatalogProductById } from "../../services/catalog.service.js";
import { getPublicOutfitsFeaturingItem } from "../../services/outfit.service.js";

import "./CatalogItemDetail.css";

const PAGE_SIZE = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getImageUrl(imageId) {
  if (!imageId) return null;

  const id =
    typeof imageId === "object"
      ? imageId._id ?? imageId.id
      : imageId;

  return id ? `${API_BASE_URL}/images/${id}` : null;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getProductId(item) {
  const id =
    item?.catalogId?._id ??
    item?.catalogId?.id ??
    item?.catalogId ??
    item?.productId?._id ??
    item?.productId?.id ??
    item?.productId;

  return typeof id === "string" ? id : id?.toString?.() ?? "";
}

function getOutfitList(result) {
  const outfits =
    result?.outfits ??
    result?.data?.outfits ??
    [];

  return Array.isArray(outfits) ? outfits : [];
}

export default function CatalogItemDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [outfits, setOutfits] = useState([]);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalOutfits: 0,
    totalPages: 0,
    hasNextPage: false,
  });

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingOutfits, setLoadingOutfits] = useState(true);

  const [productError, setProductError] = useState("");
  const [outfitsError, setOutfitsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoadingProduct(true);
      setProductError("");
      setProduct(null);

      try {
        const result = await getCatalogProductById(id);

        if (cancelled) return;

        setProduct(result);
      } catch (error) {
        if (!cancelled) {
          setProductError(
            getErrorMessage(error, "Unable to load product details.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    }

    if (id) {
      loadProduct();
    } else {
      setProductError("Product ID is missing.");
      setLoadingProduct(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadRelatedOutfits = useCallback(async () => {
    let cancelled = false;

    setLoadingOutfits(true);
    setOutfitsError("");

    try {
      const result = await getPublicOutfitsFeaturingItem({
        catalogId: id,
        page,
        pageSize: PAGE_SIZE,
      });

      if (cancelled) return;

      const outfitList = getOutfitList(result);
      const paginationData = result?.pagination ?? {};

      const totalOutfits =
        paginationData.totalOutfits ??
        paginationData.total ??
        outfitList.length;

      const totalPages =
        paginationData.totalPages ??
        Math.ceil(totalOutfits / PAGE_SIZE);

      setOutfits(outfitList);

      setPagination({
        page: paginationData.page ?? page,
        pageSize: paginationData.pageSize ?? PAGE_SIZE,
        totalOutfits,
        totalPages,
        hasNextPage:
          paginationData.hasNextPage ?? page < totalPages,
      });
    } catch (error) {
      setOutfits([]);
      setOutfitsError(
        getErrorMessage(error, "Unable to load related outfits.")
      );
    } finally {
      setLoadingOutfits(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id, page]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingOutfits(true);
      setOutfitsError("");

      try {
        const result = await getPublicOutfitsFeaturingItem({
          catalogId: id,
          page,
          pageSize: PAGE_SIZE,
        });

        if (cancelled) return;

        const outfitList = getOutfitList(result);
        const paginationData = result?.pagination ?? {};

        const totalOutfits =
          paginationData.totalOutfits ??
          paginationData.total ??
          outfitList.length;

        const totalPages =
          paginationData.totalPages ??
          Math.ceil(totalOutfits / PAGE_SIZE);

        setOutfits(outfitList);

        setPagination({
          page: paginationData.page ?? page,
          pageSize: paginationData.pageSize ?? PAGE_SIZE,
          totalOutfits,
          totalPages,
          hasNextPage:
            paginationData.hasNextPage ?? page < totalPages,
        });
      } catch (error) {
        if (!cancelled) {
          setOutfits([]);
          setOutfitsError(
            getErrorMessage(error, "Unable to load related outfits.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOutfits(false);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id, page]);

  if (loadingProduct) {
    return (
      <main className="catalog-detail-page">
        <p className="catalog-detail-status">Loading product details...</p>
      </main>
    );
  }

  if (productError || !product) {
    return (
      <main className="catalog-detail-page">
        <Link to="/" className="catalog-back-link">
          &larr; Back to Home
        </Link>

        <div className="catalog-detail-error" role="alert">
          {productError || "Product not found."}
        </div>
      </main>
    );
  }

  const productImageUrl = getImageUrl(product.imageId);

  return (
    <main className="catalog-detail-page">
      <Link to="/" className="catalog-back-link">
        &larr; Back to Home
      </Link>

      <section className="catalog-product-detail">
        <div className="catalog-product-image">
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={product.name || "Product"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="catalog-no-image">
              No image available
            </div>
          )}
        </div>

        <div className="catalog-product-info">
          <p className="catalog-eyebrow">CATALOG PRODUCT</p>

          <h1>{product.name || "Unnamed product"}</h1>

          <p className="catalog-product-category">
            {product.category || "Uncategorized"}
          </p>

          {product.color && (
            <p>
              <strong>Color:</strong> {product.color}
            </p>
          )}

          {product.isActive === false && (
            <p className="catalog-inactive-label">
              This product is currently inactive.
            </p>
          )}

          {product.styles?.length > 0 && (
            <div className="catalog-detail-field">
              <strong>Styles</strong>
              <div className="catalog-tags">
                {product.styles.map((style) => (
                  <span key={style} className="catalog-tag">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.seasons?.length > 0 && (
            <div className="catalog-detail-field">
              <strong>Seasons</strong>
              <div className="catalog-tags">
                {product.seasons.map((season) => (
                  <span key={season} className="catalog-tag">
                    {season}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.cases?.length > 0 && (
            <div className="catalog-detail-field">
              <strong>Occasions</strong>
              <div className="catalog-tags">
                {product.cases.map((itemCase) => (
                  <span key={itemCase} className="catalog-tag">
                    {itemCase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="related-outfits-section">
        <div className="related-outfits-heading">
          <div>
            <p className="catalog-eyebrow">STYLE INSPIRATION</p>
            <h2>Outfits Featuring This Product</h2>
          </div>

          {!loadingOutfits && !outfitsError && (
            <span className="related-outfits-count">
              {pagination.totalOutfits} outfit(s)
            </span>
          )}
        </div>

        {loadingOutfits && (
          <p className="catalog-detail-status">
            Loading related outfits...
          </p>
        )}

        {!loadingOutfits && outfitsError && (
          <div className="catalog-detail-error" role="alert">
            {outfitsError}
          </div>
        )}

        {!loadingOutfits && !outfitsError && outfits.length === 0 && (
          <div className="catalog-empty-state">
            <h3>No outfits found yet</h3>
            <p>
              There are no public finalized outfits featuring this product.
            </p>
          </div>
        )}

        {!loadingOutfits && !outfitsError && outfits.length > 0 && (
          <>
            <div className="related-outfits-grid">
              {outfits.map((outfit, outfitIndex) => (
                <article
                  className="related-outfit-card"
                  key={outfit._id ?? outfit.id ?? outfitIndex}
                >
                  <div className="related-outfit-card-heading">
                    <h3>Outfit</h3>
                    <span className="related-outfit-status">Public</span>
                  </div>

                  <p className="related-outfit-creator">
                    Created by:{" "}
                    {outfit.user?.name ||
                      outfit.userId?.name ||
                      "Unknown user"}
                  </p>

                  <div className="related-outfit-items">
                    {Array.isArray(outfit.items) &&
                    outfit.items.length > 0 ? (
                      outfit.items.map((item, itemIndex) => {
                        const imageUrl = getImageUrl(item.imageId);
                        const itemCatalogId = getProductId(item);
                        const isCurrentProduct =
                          itemCatalogId === id ||
                          String(item.catalogId?._id ?? item.catalogId ?? "") === id;

                        const itemContent = (
                          <>
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name || "Outfit item"}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="related-item-no-image">
                                No image
                              </div>
                            )}

                            <span className="related-item-category">
                              {item.category || "Item"}
                            </span>

                            <span className="related-item-name">
                              {item.name || "Unnamed item"}
                            </span>

                            {isCurrentProduct && (
                              <span className="current-product-label">
                                Current product
                              </span>
                            )}
                          </>
                        );

                        return (
                          <div
                            className="related-outfit-item"
                            key={item._id ?? item.id ?? itemIndex}
                          >
                            {itemCatalogId && !isCurrentProduct ? (
                              <Link
                                to={`/catalog/${itemCatalogId}`}
                                className="related-item-link"
                              >
                                {itemContent}
                              </Link>
                            ) : (
                              <div className="related-item-content">
                                {itemContent}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p>No items in this outfit.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="catalog-pagination">
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1 || loadingOutfits}
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!pagination.hasNextPage || loadingOutfits}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
