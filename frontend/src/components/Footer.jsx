import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>@{new Date().getFullYear()} LFit - Outfit Advisor</p>
      <p>Find your style, one outfit at a time.</p>
    </footer>
  );
}
