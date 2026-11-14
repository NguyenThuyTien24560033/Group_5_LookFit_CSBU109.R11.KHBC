
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getRecommendations } from "../../services/recommendation.service.js";
import "./Recommendation.css";

const initialCriteria = {
  case: "casual",
  style: "basic",
  season: "summer",
  weather: "warm",
  lifestyle: "student",
};

function Recommendation() {
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState(initialCriteria);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCriteria((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const result = await getRecommendations(criteria, 1);
      const recommendations = result.recommendations ?? [];

      if (recommendations.length === 0) {
        setMessage("No matching outfits found. Try different criteria.");
        return;
      }

      navigate("/recommendation/result", {
        state: {
          recommendations,
          criteria,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      setMessage(
        error.message || "Unable to get recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "case",
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
      name: "style",
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
      name: "season",
      label: "Season",
      options: [
        ["spring", "Spring"],
        ["summer", "Summer"],
        ["autumn", "Autumn"],
        ["winter", "Winter"],
      ],
    },
    {
      name: "weather",
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
      name: "lifestyle",
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

  return (
    <main className="recommendation-page">
      <div className="recommendation-container">

        {/* BACK BUTTON */}
        <button
          type="button"
          className="recommendation-back"
          onClick={() => navigate("/home")}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* PAGE HEADING */}
        <div className="recommendation-heading">
          <p className="recommendation-eyebrow">
            PERSONAL STYLING <span>•</span> LOOKFIT
          </p>

          <h1>
            Find your next{" "}
            <em>favorite outfit.</em>
          </h1>

          <p className="recommendation-subtitle">
            Tell us a little about your day and we'll curate
            looks that fit the moment.
          </p>
        </div>

        {/* RECOMMENDATION FORM */}
        <form
          onSubmit={handleSubmit}
          className="recommendation-form"
        >
          <div className="recommendation-fields">
            {fields.map((field) => (
              <div
                key={field.name}
                className="recommendation-field"
              >
                <label htmlFor={field.name}>
                  {field.label}
                </label>

                <select
                  id={field.name}
                  name={field.name}
                  value={criteria[field.name]}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {field.options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="recommendation-form-footer">
            <button
              type="submit"
              className="recommendation-submit"
              disabled={loading}
            >
              {loading ? (
                "Finding outfits..."
              ) : (
                <>
                  Find Outfits
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {message && (
            <p
              className="recommendation-message"
              role="alert"
            >
              {message}
            </p>
          )}
        </form>


  

      </div>
    </main>
  );
}

export default Recommendation;
