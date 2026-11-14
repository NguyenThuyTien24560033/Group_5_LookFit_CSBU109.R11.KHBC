import "./OutfitArt.css";
export default function OutfitArt() {
  return (
    <div
      className="hero-illustration"
      aria-label="Blue dress illustration"
    >
      <div
        className="hero-illustration__orbits"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
        <i />
        <i />
        <i />
        <i />
      </div>

      <div
        className="hero-illustration__circle"
        aria-hidden="true"
      />

      <img
        src="/OutfitArt.png"
          alt="Editorial outfit"
        className="hero-illustration__dress"
      />

      <div className="hero-illustration__mood">
        <span>Today's mood</span>
        <strong>Effortlessly polished</strong>
      </div>

      <div className="hero-illustration__match">
        LOOK 08 &nbsp;·&nbsp; 92% match
      </div>
    </div>
  );
}
