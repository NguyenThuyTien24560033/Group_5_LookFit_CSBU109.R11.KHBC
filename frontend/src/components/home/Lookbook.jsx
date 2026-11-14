
import { ArrowRight, Heart } from "lucide-react";
import "./Lookbook.css";

const looks = [
  {
    title: "The quiet confidence",
    author: "Maya R.",
    emoji: "🧥",
    tone: "blue",
    likes: "128",
  },
  {
    title: "Sunday in the city",
    author: "Elena K.",
    emoji: "👒",
    tone: "peach",
    likes: "94",
  },
  {
    title: "Soft power dressing",
    author: "LookFit editor",
    emoji: "👜",
    tone: "pink",
    likes: "211",
  },
];

export default function Lookbook() {
  return (
    <section id="feed" className="feed-section container">
      <div className="section-heading feed-heading">
        <div>
          <span className="eyebrow">FROM THE COMMUNITY</span>
          <h2>
            Lookbook <em>edit.</em>
          </h2>
        </div>

        <a href="/login" className="text-link">
          Explore all looks <ArrowRight size={15} />
        </a>
      </div>

      <div className="look-grid">
        {looks.map((look) => (
          <article className="look-card" key={look.title}>
            <div className={`look-image tone-${look.tone}`}>
              <span>{look.emoji}</span>

              <button type="button" aria-label={`Like ${look.title}`}>
                <Heart size={18} />
              </button>

              <div className="look-score">
                FINAL <span>·</span> 94%
              </div>
            </div>

            <div className="look-meta">
              <div>
                <h4>{look.title}</h4>
                <p>by {look.author}</p>
              </div>

              <span className="like-count">
                <Heart size={13} /> {look.likes}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
