
import { useState } from "react";
import "./PredefinedOutfits.css";
import AdminLayout from "../../components/layout/Adminlayout.jsx";
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
const DEMO_MODE = true;
const INITIAL_CRITERIA = {
  case: "casual",
  style: "basic",
  season: "summer",
  weather: "warm",
  lifestyle: "student",
};

const DEMO_ITEMS = [
  {
    name: "Classic White Shirt",
    category: "Top",
    color: "White",
    emoji: "👔",
  },
  {
    name: "Straight Leg Jeans",
    category: "Bottom",
    color: "Blue",
    emoji: "👖",
  },
  {
    name: "Minimal Sneakers",
    category: "Shoes",
    color: "White",
    emoji: "👟",
  },
  {
    name: "Everyday Tote Bag",
    category: "Accessory",
    color: "Beige",
    emoji: "👜",
  },
  {
    name: "Casual Jacket",
    category: "Outerwear",
    color: "Brown",
    emoji: "🧥",
  },
  {
    name: "Summer Dress",
    category: "Dress",
    color: "Pink",
    emoji: "👗",
  },
];

function createMockOutfits(criteria) {
  const bodyShapes = [
    "Hourglass",
    "Pear",
    "Rectangle",
  ];

  return bodyShapes.map((shape, index) => {
    const items = [
      DEMO_ITEMS[(index * 2) % DEMO_ITEMS.length],
      DEMO_ITEMS[(index * 2 + 1) % DEMO_ITEMS.length],
      DEMO_ITEMS[(index * 2 + 2) % DEMO_ITEMS.length],
    ];

    return {
      id: `demo-${Date.now()}-${index}`,
      bodyShape: shape,
      ...criteria,
      items,
    };
  });
}

function getLabel(key, value) {
  const field = FIELDS.find((item) => item.key === key);
  const option = field?.options.find(([id]) => id === value);
  return option?.[1] ?? value;
}

export default function PredefinedOutfits() {
  const [criteria, setCriteria] = useState({
    ...INITIAL_CRITERIA,
  });

  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  function generateOutfits(event) {
    event.preventDefault();

    setLoading(true);
    setNotice("");

    // Frontend mock generation
    const generated = createMockOutfits(criteria);

    setOutfits(generated);
    setNotice(
      `Successfully generated ${generated.length} demo outfits.`
    );
    setLoading(false);
  }

  function resetFilters() {
    setCriteria({ ...INITIAL_CRITERIA });
    setOutfits([]);
    setNotice("");
  }

  return (
    <div className="lf-outfits-page">
      {/* ADMIN HEADER */}
      

      <main className="lf-outfits-container">
        {/* PAGE HEADING */}
        <div className="lf-outfits-intro">
          <p className="lf-outfits-eyebrow">
            ADMIN CONSOLE / CATALOG
          </p>

          <h1>Predefined Outfits</h1>

          <p className="lf-outfits-subtitle">
            Create curated outfit combinations
            based on your selected criteria.
          </p>
        </div>

        {/* GENERATOR */}
        <section className="lf-generator-panel">
          <div className="lf-generator-heading">
            <div>
              <h2>Outfit Generator</h2>
              <p>
                Select your preferences to generate
                predefined looks.
              </p>
            </div>

            {DEMO_MODE && (
  <span className="lf-demo-badge">
    DEMO MODE
  </span>
)}
          </div>

          <form onSubmit={generateOutfits}>
            <div className="lf-criteria-grid">
              {FIELDS.map(
                ({ key, label, options }) => (
                  <div
                    className="lf-criteria-field"
                    key={key}
                  >
                    <label
                      htmlFor={`criteria-${key}`}
                    >
                      {label}
                    </label>

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
                      {options.map(
                        ([value, optionLabel]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {optionLabel}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )
              )}
            </div>

            <div className="lf-generator-actions">
              <button
                type="button"
                className="lf-reset-btn"
                onClick={resetFilters}
              >
                Reset Filters
              </button>

              <button
                type="submit"
                className="lf-generate-btn"
                disabled={loading}
              >
                ✨{" "}
                {loading
                  ? "Generating..."
                  : "Generate Outfits"}
              </button>
            </div>
          </form>
        </section>

        {/* RESULTS */}
        {notice && (
          <div
            className="lf-outfits-notice"
            role="status"
          >
            ✓ {notice}
          </div>
        )}

        {outfits.length > 0 && (
          <section className="lf-generated-section">
            <div className="lf-generated-heading">
              <div>
                <h2>Generated Looks</h2>
                <p>
                  Explore your newly created
                  outfit combinations.
                </p>
              </div>

              <span className="lf-results-count">
                {outfits.length} Outfits
              </span>
            </div>

            <div className="lf-generated-grid">
              {outfits.map((outfit, index) => (
                <article
                  className="lf-generated-card"
                  key={outfit.id}
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
                    {outfit.items.map(
                      (item, itemIndex) => (
                        <div
                          className="lf-look-item"
                          key={itemIndex}
                        >
                          <div className="lf-look-item-image">
                            {item.emoji}
                          </div>

                          <strong>{item.name}</strong>

                          <span>
                            {item.category} · {item.color}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="lf-look-details">
                    <span>
                      {getLabel("case", outfit.case)}
                    </span>

                    <span>
                      {getLabel("style", outfit.style)}
                    </span>

                    <span>
                      {getLabel("season", outfit.season)}
                    </span>

                    <span>
                      {getLabel("weather", outfit.weather)}
                    </span>

                    <span>
                      {getLabel(
                        "lifestyle",
                        outfit.lifestyle
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
