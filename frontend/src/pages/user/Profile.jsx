import { useEffect, useState } from "react";
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
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "beige", label: "Beige" },
  { value: "brown", label: "Brown" },
  { value: "navy", label: "Navy" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "pink", label: "Pink" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
];

const bodyShapeLabels = {
  hourglass: "Hourglass",
  pear: "Pear",
  "inverted-triangle": "Inverted Triangle",
  rectangle: "Rectangle",
  apple: "Apple",
};

export default function Profile() {
  const [form, setForm] = useState(initialForm);
  const [bodyShape, setBodyShape] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function readProfile(result) {
    return result?.data ?? result?.profile ?? result;
  }

  function applyProfile(profile) {
    setForm({
      height: profile.height ?? "",
      weight: profile.weight ?? "",
      bust: profile.bust ?? "",
      waist: profile.waist ?? "",
      hip: profile.hip ?? "",
      favoriteColors: Array.isArray(profile.favoriteColors)
        ? profile.favoriteColors.map((c) => String(c).toLowerCase())
        : [],
    });

    setBodyShape(profile.bodyShape ?? "");
    setHasProfile(true);
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
          throw new Error("Profile response does not contain valid profile data.");
        }

        if (cancelled) return;

        applyProfile(profile);
        setMessage("Profile loaded successfully.");
        setMessageType("success");
      } catch (error) {
        if (cancelled) return;

        if (error.status === 404) {
          setForm(initialForm);
          setBodyShape("");
          setHasProfile(false);
          setMessage("No profile found. Please create your profile.");
          setMessageType("info");
        } else {
          setMessage(error.message || "Unable to load profile.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
    const normalized = colorValue.toLowerCase();

    setForm((previous) => ({
      ...previous,
      favoriteColors: previous.favoriteColors.includes(normalized)
        ? previous.favoriteColors.filter((item) => item !== normalized)
        : [...previous.favoriteColors, normalized],
    }));
  }

  function getProfileData() {
    return {
      height: Number(form.height),
      weight: Number(form.weight),
      bust: Number(form.bust),
      waist: Number(form.waist),
      hip: Number(form.hip),
      favoriteColors: form.favoriteColors.map((c) => c.toLowerCase()),
    };
  }

  function validateForm() {
    const measurements = [
      ["Height", form.height],
      ["Weight", form.weight],
      ["Bust", form.bust],
      ["Waist", form.waist],
      ["Hip", form.hip],
    ];

    for (const [label, value] of measurements) {
      if (
        value === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
      ) {
        setMessage(`${label} must be a number greater than zero.`);
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

      if (profile?.bodyShape) {
        setBodyShape(profile.bodyShape);
      } else {
        const latestResult = await getProfile();
        const latestProfile = readProfile(latestResult);

        if (latestProfile?.bodyShape) {
          setBodyShape(latestProfile.bodyShape);
        }
      }

      if (profile?.height != null) {
        applyProfile(profile);
      } else {
        setHasProfile(true);
      }

      setMessage(
        hasProfile
          ? "Profile updated successfully."
          : "Profile created successfully."
      );
      setMessageType("success");
    } catch (error) {
      if (error.status === 409) {
        setMessage(
          "A profile already exists. Reload the page to retrieve it."
        );
      } else {
        setMessage(error.message || "Unable to save profile.");
      }

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-page">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1>My Profile</h1>
        <p>Manage your measurements and style preferences.</p>

        <form onSubmit={handleSubmit} className="profile-form">
          {[
            ["height", "Height (cm)"],
            ["weight", "Weight (kg)"],
            ["bust", "Bust (cm)"],
            ["waist", "Waist (cm)"],
            ["hip", "Hip (cm)"],
          ].map(([name, label]) => (
            <div className="profile-field" key={name}>
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type="number"
                min="0.1"
                step="any"
                value={form[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <fieldset className="profile-colors">
            <legend>Favorite Colors</legend>

            <div className="profile-color-list">
              {COLOR_OPTIONS.map(({ value, label }) => (
                <label key={value} className="profile-color-option">
                  <input
                    type="checkbox"
                    checked={form.favoriteColors.includes(value)}
                    onChange={() => handleColorChange(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="profile-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : hasProfile
                  ? "Save Changes"
                  : "Create Profile"}
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`profile-message profile-message--${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}