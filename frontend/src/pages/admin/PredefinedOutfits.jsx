import { useState } from "react";
import api from "../../services/api.js";
import "./PredefinedOutfits.css";

// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://group-5-lookfit-csbu109-r11-khbc.onrender.com/api";

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

const FIELDS = [
  {
    key: "case",
    label: "Occasion",
    options: [
      ["casual", "Casual"],
      ["daily", "Daily"],
      ["school", "School"],
      ["work", "Work"],
      ["business", "Business"],
      ["party", "Party"],
      ["date", "Date"],
      ["wedding", "Wedding"],
      ["travel", "Travel"],
      ["sport", "Sport"],
      ["formal", "Formal"],
    ],
  },
  {
    key: "style",
    label: "Style",
    options: [
      ["basic", "Basic"],
      ["minimal", "Minimal"],
      ["smart-casual", "Smart Casual"],
      ["street", "Streetwear"],
      ["vintage", "Vintage"],
      ["preppy", "Preppy"],
      ["sporty", "Sporty"],
      ["chic", "Chic"],
      ["classic", "Classic"],
      ["bohemian", "Bohemian"],
      ["old-money", "Old Money"],
      ["y2k", "Y2K"],
      ["coquette", "Coquette"],
      ["grunge", "Grunge"],
    ],
  },
  {
    key: "season",
    label: "Season",
    options: [
      ["spring", "Spring"],
      ["summer", "Summer"],
      ["autumn", "Autumn"],
      ["winter", "Winter"],
    ],
  },
  {
    key: "weather",
    label: "Weather",
    options: [
      ["hot", "Hot"],
      ["warm", "Warm"],
      ["mild", "Mild"],
      ["cool", "Cool"],
      ["cold", "Cold"],
      ["rainy", "Rainy"],
      ["windy", "Windy"],
      ["humid", "Humid"],
    ],
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    options: [
      ["student", "Student"],
      ["daily", "Daily"],
      ["office", "Office"],
      ["active", "Active"],
      ["travel", "Travel"],
      ["outdoor", "Outdoor"],
      ["social", "Social"],
      ["work-from-home", "Work From Home"],
    ],
  },
];

const INITIAL_CRITERIA = {
  case: "casual",
  style: "basic",
  season: "summer",
  weather: "warm",
  lifestyle: "student",
};

function getLabel(key, value) {
  const field = FIELDS.find((item) => item.key === key);
  const option = field?.options.find(([id]) => id === value);
  return option?.[1] ?? value;
}

export default function PredefinedOutfits() {
  const [criteria, setCriteria] = useState({ ...INITIAL_CRITERIA });
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function generateOutfits(event) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    setError("");
    setOutfits([]);

    try {
      const response = await api.post(
        "/admin/predefined-outfits",
        criteria
      );

      const data = response.data?.data ?? [];
      const count = response.data?.count ?? data.length;
      const validOutfits = Array.isArray(data) ? data : [];

      setOutfits(validOutfits);

      if (count > 0) {
        setNotice(`Successfully generated and saved ${count} new predefined outfits in database.`);
      } else {
        setNotice("All predefined outfit templates for this combination already exist in database.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to generate predefined outfits. Make sure you are logged in as Admin."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setCriteria({ ...INITIAL_CRITERIA });
    setOutfits([]);
    setNotice("");
    setError("");
  }

  return (
    <div className="lf-admin-page">
      <main className="lf-admin-container">
        {/* HEADER */}
        <div className="lf-admin-intro">
          <p className="lf-admin-kicker">ADMIN CONSOLE</p>
          <h1>Predefined Outfits</h1>
          <p className="lf-admin-description">
            Generate curated public outfit templates based on occasion, style, season, weather and lifestyle criteria.
          </p>
        </div>

        {error && (
          <p style={{ color: "#ba455a", background: "#fff0f0", padding: "12px 16px", borderRadius: 8, margin: "16px 0" }} role="alert">
            {error}
          </p>
        )}

        {/* GENERATOR FORM */}
        <section className="lf-generator-card">
          <div className="lf-generator-header">
            <h2>Outfit Criteria</h2>
            <p>Select criteria to generate matching public looks.</p>
          </div>

          <form onSubmit={generateOutfits} className="lf-generator-form">
            <div className="lf-criteria-grid">
              {FIELDS.map(({ key, label, options }) => (
                <div className="lf-criteria-field" key={key}>
                  <label htmlFor={`criteria-${key}`}>{label}</label>

                  <select
                    id={`criteria-${key}`}
                    name={key}
                    value={criteria[key]}
                    onChange={(event) =>
                      setCriteria((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                    disabled={loading}
                  >
                    {options.map(([value, optionLabel]) => (
                      <option key={value} value={value}>
                        {optionLabel}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="lf-generator-actions">
              <button
                type="button"
                className="lf-reset-btn"
                onClick={resetFilters}
                disabled={loading}
              >
                Reset Filters
              </button>

              <button
                type="submit"
                className="lf-generate-btn"
                disabled={loading}
              >
                ✨ {loading ? "Generating & Saving..." : "Generate Outfits"}
              </button>
            </div>
          </form>
        </section>

        {/* NOTICE */}
        {notice && (
          <div className="lf-outfits-notice" role="status">
            ✓ {notice}
          </div>
        )}

        {/* RESULTS */}
        {outfits.length > 0 && (
          <section className="lf-generated-section">
            <div className="lf-generated-heading">
              <div>
                <h2>Generated Looks</h2>
                <p>Explore your newly created outfit combinations saved in database.</p>
              </div>

              <span className="lf-results-count">
                {outfits.length} Outfits
              </span>
            </div>

            <div className="lf-generated-grid">
              {outfits.map((outfit, index) => {
                const items = Array.isArray(outfit.items) ? outfit.items : [];

                return (
                  <article
                    className="lf-generated-card"
                    key={outfit._id || outfit.id || index}
                  >
                    <div className="lf-generated-card-top">
                      <span className="lf-look-number">
                        LOOK {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="lf-shape-badge">
                        {outfit.bodyShape}
                      </span>
                    </div>

                    <div className="lf-look-items">
                      {items.map((item, itemIndex) => {
                        const img = getItemImageUrl(item);

                        return (
                          <div className="lf-look-item" key={item._id || itemIndex}>
                            <div className="lf-look-item-image">
                              {img ? (
                                <img
                                  src={img}
                                  alt={item.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                                />
                              ) : (
                                <span>👕</span>
                              )}
                            </div>

                            <strong>{item.name || "Item"}</strong>

                            <span>
                              {item.category} · {item.color || ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="lf-look-details">
                      <span>{getLabel("case", outfit.case)}</span>
                      <span>{getLabel("style", outfit.style)}</span>
                      <span>{getLabel("season", outfit.season)}</span>
                      <span>{getLabel("weather", outfit.weather)}</span>
                      <span>{getLabel("lifestyle", outfit.lifestyle)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}