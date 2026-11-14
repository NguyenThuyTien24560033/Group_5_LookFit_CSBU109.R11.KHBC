
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import "./Reviews.css";
import { Link } from "react-router-dom";

const testimonials = [
  {
    initials: "MR",
    name: "Maya R.",
    role: "Everyday stylist",
    stars: "★★★★★",
    quote:
      "The recommendations feel surprisingly personal. I get dressed for work in minutes and still feel like myself.",
    tag: "5.0 · 92% style match",
    avatar: "avatar-one",
    featured: false,
  },
  {
    initials: "EK",
    name: "Elena K.",
    role: "LookFit member",
    stars: "★★★★★",
    quote:
      "The AI understands the mood I want before I even know how to name it.",
    tag: "5.0 · Styling made simple",
    avatar: "avatar-two",
    featured: true,
  },
  {
    initials: "JL",
    name: "Jules L.",
    role: "Community member",
    stars: "★★★★★",
    quote:
      "Swapping one piece creates a whole new outfit. It is practical, thoughtful, and fun.",
    tag: "4.9 · Easy to use",
    avatar: "avatar-three",
    featured: false,
  },
  {
    initials: "NS",
    name: "Nora S.",
    role: "Creative director",
    stars: "★★★★½",
    quote:
      "LookFit gives me fresh combinations without making my wardrobe feel complicated.",
    tag: "4.8 · Smart suggestions",
    avatar: "avatar-one",
    featured: false,
  },
  {
    initials: "AC",
    name: "Ava C.",
    role: "LookFit member",
    stars: "★★★★★",
    quote:
      "The interface is so calm and clear. I actually enjoy planning outfits now.",
    tag: "5.0 · Effortless planning",
    avatar: "avatar-two",
    featured: true,
  },
  {
    initials: "TW",
    name: "Talia W.",
    role: "Weekend stylist",
    stars: "★★★★★",
    quote:
      "It nailed my proportions and suggested pieces I already own in new ways.",
    tag: "5.0 · 94% style match",
    avatar: "avatar-three",
    featured: false,
  },
  {
    initials: "IB",
    name: "Isla B.",
    role: "LookFit member",
    stars: "★★★★½",
    quote:
      "The daily edits save time and make getting ready feel much more intentional.",
    tag: "4.7 · Daily inspiration",
    avatar: "avatar-one",
    featured: false,
  },
  {
    initials: "SM",
    name: "Sofia M.",
    role: "Community member",
    stars: "★★★★★",
    quote:
      "I found my signature style faster than I expected. Every recommendation feels considered.",
    tag: "5.0 · Personal feel",
    avatar: "avatar-two",
    featured: true,
  },
  {
    initials: "RK",
    name: "Rina K.",
    role: "Everyday stylist",
    stars: "★★★★★",
    quote:
      "The outfit builder is intuitive, beautiful, and genuinely useful on busy mornings.",
    tag: "5.0 · Beautifully simple",
    avatar: "avatar-three",
    featured: false,
  },
  {
    initials: "DP",
    name: "Dana P.",
    role: "LookFit member",
    stars: "★★★★½",
    quote:
      "I love how accurately it balances comfort, color, and the occasion I choose.",
    tag: "4.9 · Thoughtful AI",
    avatar: "avatar-one",
    featured: false,
  },
];

const legacyReviews = [
  {
    ...testimonials[0],
    quote:
      "The recommendations feel surprisingly personal. I can get dressed for work in minutes and still feel completely like myself.",
    tag: "92% style match",
  },
  {
    ...testimonials[1],
    quote:
      "LookFit turned my wardrobe into a calm little studio. The AI understands the mood I want before I even know how to name it.",
    tag: "Styling made simple",
  },
  {
    ...testimonials[2],
    quote:
      "I love how easy it is to swap one piece and see a whole new outfit. It is practical, thoughtful, and actually fun.",
    tag: "4.9 / 5 experience",
  },
];

function TestimonialCard({ review }) {
  return (
    <article
      className={`testimonial-card ${review.featured ? "featured" : ""}`}
    >
      <div className="testimonial-top">
        <span className={`testimonial-avatar ${review.avatar}`}>
          {review.initials}
        </span>

        <div>
          <strong>{review.name}</strong>
          <span>{review.role}</span>
        </div>

        <span className="stars">{review.stars}</span>
      </div>

      <p>“{review.quote}”</p>

      <span className="testimonial-tag">{review.tag}</span>
    </article>
  );
}

export default function Reviews() {
  const [reviewIndex, setReviewIndex] = useState(0);

  const previousReview = () => {
    setReviewIndex((prev) =>
      (prev - 1 + legacyReviews.length) % legacyReviews.length
    );
  };

  const nextReview = () => {
    setReviewIndex((prev) =>
      (prev + 1) % legacyReviews.length
    );
  };

  return (
    <section id="reviews" className="testimonials-section">
      <div className="container">

        {/* SECTION HEADING */}
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              REAL STORIES
              <span className="dot"></span>
              LOOKFIT COMMUNITY
            </span>

            <h2>
              Loved by women who{" "}
              <em>style with intention.</em>
            </h2>
          </div>
        </div>

        {/* INFINITE TESTIMONIAL MARQUEE */}
        {/* CALL TO ACTION */}
<div className="testimonial-cta">
  <p>
    Ready to make getting dressed feel more like you?
  </p>

  <Link className="primary-button" to="/login">
    Begin your style journey
    <ArrowRight size={16} />
  </Link>
</div>

        {/* LEGACY CAROUSEL */}
        <div className="legacy-testimonials" aria-hidden="true">
          <button
            type="button"
            className="carousel-arrow"
            onClick={previousReview}
            aria-label="Previous review"
            tabIndex={-1}
          >
            ‹
          </button>

          <div className="testimonial-viewport">
            <div
              className="testimonial-track"
              style={{ opacity: 1 }}
            >
              {legacyReviews.map((review, index) => (
                <div
                  key={`legacy-${index}`}
                  style={{
                    display:
                      reviewIndex === index ? "block" : "none",
                  }}
                >
                  <TestimonialCard review={review} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="carousel-arrow"
            onClick={nextReview}
            aria-label="Next review"
            tabIndex={-1}
          >
            ›
          </button>
        </div>

        {/* CAROUSEL DOTS */}
        <div
          className="carousel-dots"
          aria-label="Review navigation"
        >
          {legacyReviews.map((_, index) => (
            <button
              key={index}
              type="button"
              className={reviewIndex === index ? "active" : ""}
              onClick={() => setReviewIndex(index)}
              aria-label={`Show review ${index + 1}`}
              tabIndex={-1}
            />
          ))}
        </div>

        {/* CALL TO ACTION */}
        <div className="testimonial-cta">
          <p>
            Ready to make getting dressed feel more like you?
          </p>

     <Link className="primary-button" to="/login">
         Begin your style journey
    <ArrowRight size={16} />
    </Link>
        </div>

      </div>
    </section>
  );
}
