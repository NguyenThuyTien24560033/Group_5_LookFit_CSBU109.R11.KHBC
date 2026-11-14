
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Ruler, Save } from "lucide-react";
import {
  createProfile,
  updateProfile,
  getProfile,
} from "../../services/profile.service.js";
import "./Profile.css";

const initialForm = {
  height: "",
  weight: "",
  bust: "",
  waist: "",
  hip: "",
  favoriteColors: [],
};

const COLOR_OPTIONS = [
  { value: "black", label: "Black", hex: "#202020" },
  { value: "white", label: "White", hex: "#ffffff" },
  { value: "blue", label: "Blue", hex: "#7da6c8" },
  { value: "navy", label: "Navy", hex: "#293e60" },
  { value: "beige", label: "Beige", hex: "#e6d4c0" },
  { value: "brown", label: "Brown", hex: "#89614d" },
  { value: "pink", label: "Pink", hex: "#d59bb0" },
  { value: "green", label: "Green", hex: "#8fa68b" },
  { value: "gray", label: "Grey", hex: "#9d9d9d" },
  { value: "yellow", label: "Mustard", hex: "#d6aa38" },
  { value: "olive", label: "Olive", hex: "#808b50" },
  { value: "burgundy", label: "Burgundy", hex: "#743047" },
  { value: "purple", label: "Lavender", hex: "#b6a4d1" },
  { value: "peach", label: "Peach", hex: "#f1b49e" },
  { value: "orange", label: "Rust", hex: "#ac6046" },
  { value: "teal", label: "Teal", hex: "#609e98" },
  { value: "red", label: "Red", hex: "#c54c53" },
];

const MEASUREMENTS = [
  { name: "height", label: "Height", unit: "cm" },
  { name: "weight", label: "Weight", unit: "kg" },
  { name: "bust", label: "Bust", unit: "cm" },
  { name: "waist", label: "Waist", unit: "cm" },
  { name: "hip", label: "Hips", unit: "cm" },
];

function readProfile(result) {
  return result?.data ?? result?.profile ?? result;
}

export default function Profile() {
  const [form, setForm] = useState(initialForm);
  const [bodyShape, setBodyShape] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function applyProfile(profile) {
    setForm({
      height: profile.height ?? "",
      weight: profile.weight ?? "",
      bust: profile.bust ?? "",
      waist: profile.waist ?? "",
      hip: profile.hip ?? "",
      favoriteColors: Array.isArray(profile.favoriteColors)
        ? profile.favoriteColors.map((c) =>
            String(c).toLowerCase()
          )
        : [],
    });

    setBodyShape(profile.bodyShape ?? "");
    setHasProfile(true);
    setEditing(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const result = await getProfile();
        const profile = readProfile(result);

        if (
          !profile ||
          profile.height == null ||
          profile.bust == null ||
          profile.waist == null ||
          profile.hip == null
        ) {
          throw new Error(
            "Profile response does not contain valid profile data."
          );
        }

        if (cancelled) return;
        applyProfile(profile);
        setMessage("");
      } catch (error) {
        if (cancelled) return;

        if (error.status === 404) {
          setForm({ ...initialForm, favoriteColors: [] });
          setHasProfile(false);
          setEditing(true);
          setMessage("No profile found. Create your profile.");
          setMessageType("info");
        } else {
          setMessage(
            "Backend is unavailable. You can still preview and edit the form."
          );
          setMessageType("info");
          setEditing(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleColorChange(colorValue) {
    setForm((previous) => ({
      ...previous,
      favoriteColors: previous.favoriteColors.includes(colorValue)
        ? previous.favoriteColors.filter(
            (item) => item !== colorValue
          )
        : [...previous.favoriteColors, colorValue],
    }));
  }

  function getProfileData() {
    return {
      height: Number(form.height),
      weight: Number(form.weight),
      bust: Number(form.bust),
      waist: Number(form.waist),
      hip: Number(form.hip),
      favoriteColors: form.favoriteColors,
    };
  }

  function validateForm() {
    for (const { name, label } of MEASUREMENTS) {
      const value = form[name];

      if (
        value === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
      ) {
        setMessage(`${label} must be greater than zero.`);
        setMessageType("error");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setMessage("");

    try {
      const result = hasProfile
        ? await updateProfile(getProfileData())
        : await createProfile(getProfileData());

      const profile = readProfile(result);

      if (profile?.height != null) {
        applyProfile(profile);
      } else {
        setHasProfile(true);
        setEditing(false);
      }

      if (profile?.bodyShape) {
        setBodyShape(profile.bodyShape);
      }

      setMessage(
        hasProfile
          ? "Profile updated successfully."
          : "Profile created successfully."
      );
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to save profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="lookfit-profile-page">
      <div className="lookfit-profile-container">
        <Link to="/home" className="profile-back-button">
          <ArrowLeft size={18} />
          Back
        </Link>

        <div className="profile-heading">
          <p className="profile-eyebrow">
            YOUR PROFILE <span>•</span> PERSONAL FIT
          </p>

          <h1>
            Make it feel <em>like you.</em>
          </h1>

          <p className="profile-subtitle">
            Add your measurements and color preferences so every
            LookFit recommendation feels more personal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-layout">
          <section className="profile-measurements-card">
            <div className="profile-card-heading">
              <div>
                <h2>Your measurements</h2>
                <p>
                  Use centimeters and kilograms for the best fit.
                </p>
              </div>

              <span className="profile-measure-icon">
                <Ruler size={22} />
              </span>
            </div>

            <div className="profile-measurement-grid">
              {MEASUREMENTS.map(({ name, label, unit }) => (
                <div className="profile-measure-field" key={name}>
                  <label htmlFor={name}>{label}</label>

                  <div className="profile-input-wrap">
                    <input
                      id={name}
                      name={name}
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder={unit}
                      value={form[name]}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      required
                    />
                    <span>{unit.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>

            {bodyShape && (
              <p className="profile-body-shape">
                Body shape:{" "}
                <strong>
                  {bodyShape.replace(/-/g, " ")}
                </strong>
              </p>
            )}
          </section>

          <div className="profile-right-column">
            <section className="profile-preferences-card">
              <h2>Color preferences</h2>
              <p>Choose the colors you reach for most.</p>

              <div className="profile-color-grid">
                {COLOR_OPTIONS.map(({ value, label, hex }) => {
                  const selected =
                    form.favoriteColors.includes(value);

                  return (
                    <label
                      key={value}
                      className={`profile-color-pill ${
                        selected ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          handleColorChange(value)
                        }
                        disabled={!editing || saving}
                      />

                      <span
                        className="profile-color-dot"
                        style={{ backgroundColor: hex }}
                      />

                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="profile-save-card">
              <div className="profile-save-description">
                <strong>Ready to update?</strong>
                <p>
                  Review your measurements and preferences first.
                </p>
              </div>

              <div className="profile-save-buttons">
                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={() => setEditing(true)}
                  disabled={editing || saving}
                >
                  Edit Profile
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={!editing || saving}
                >
                  <Save size={17} />
                  {saving
                    ? "Saving..."
                    : hasProfile
                      ? "Save Changes"
                      : "Create Profile"}
                </button>
              </div>
            </section>

            {message && (
              <p
                className={`profile-feedback profile-feedback--${messageType}`}
                role={messageType === "error" ? "alert" : "status"}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
