
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png"
            alt="LookFit"
          />
          <p>
            Your personal styling studio for everyday confidence,
            considered outfits, and a wardrobe that feels like you.
          </p>
        </div>

        <div className="footer-column">
          <h4>LookFit</h4>
          <a href="#studio">Styling studio</a>
          <a href="#feed">Community lookbook</a>
          <a href="#top">About us</a>
        </div>

        <div className="footer-column">
          <h4>Helpful links</h4>
          <a href="#faq">FAQ</a>
          <a href="#terms">Terms of use</a>
          <a href="#privacy">Privacy policy</a>
        </div>

        <div className="footer-column">
          <h4>Stay connected</h4>
          <a href="mailto:hello@lookfit.studio">hello@lookfit.studio</a>
          <a href="#instagram">Instagram</a>
          <a href="#team">LookFit Studio team</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 LookFit Studio. All rights reserved.</span>
        <span>Made with intention for your everyday.</span>
      </div>
    </footer>
  );
}
