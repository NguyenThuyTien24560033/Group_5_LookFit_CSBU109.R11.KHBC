import { useState } from "react";
import api from "../../services/api.js";
import "./PredefinedOutfits.css";

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

function getId(item) {
  return item?._id ?? item?.id;
}

export default function PredefinedOutfits() {
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generateOutfits(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");
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
        setNotice(`Create ${count} predefined outfit mới.`);
      } else {
        setNotice(
          "No have new created outfit."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Do not create predefined outfits."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Predefined Outfits</h1>

      <p>
        Generate public outfit templates based on the selected criteria.
        The system may skip existing combinations.
      </p>

      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}

      <form onSubmit={generateOutfits}>
        {FIELDS.map(({ key, label, options }) => (
          <div key={key}>
            <label htmlFor={`criteria-${key}`}>
              {label}:
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
              {options.map(([value, optionLabel]) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? "Creating outfits..." : "Generate Outfits"}
        </button>
      </form>

      {outfits.length > 0 && (
        <section>
          <h2>Newly created outfits ({outfits.length})</h2>

          {outfits.map((outfit, index) => (
            <article key={getId(outfit) ?? index}>
              <h3>Body shape: {outfit.bodyShape}</h3>

              <p>
                {outfit.case} · {outfit.style} · {outfit.season}
              </p>

              <p>
                Weather: {outfit.weather} · Lifestyle:{" "}
                {outfit.lifestyle}
              </p>

              <div>
                {outfit.items?.map((item, itemIndex) => (
                  <div key={getId(item) ?? itemIndex}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name || "Outfit item"}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "contain",
                        }}
                      />
                    )}

                    <p>{item.name || "Unnamed item"}</p>

                    <p>
                      {item.category} · {item.color}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
