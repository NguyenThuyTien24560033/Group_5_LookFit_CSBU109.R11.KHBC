import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OutfitArt from '../home/OutfitArt'
import { ArrowRight, ArrowUp, Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Header.css'
import Footer from "./Footer"
import Navigation from "./Navigation"
import Lookbook from "../home/Lookbook"

export default function Page() {
  const { user, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const navigate = useNavigate();

  const isLoggedIn = isAuthenticated;

  const name = String(
    user?.name || user?.user_metadata?.full_name || ''
  ).trim();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profile = { name, initials };

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > window.innerHeight * 0.85)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      setAccountMenuOpen(false);
      navigate('/');
    }
  };

  return (
    <main className="page">
      <nav className="nav container">
        <a className="brand" href="#top" aria-label="LookFit home">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png" alt="LookFit" />
        </a>

        <Navigation
          internal={isLoggedIn}
          menuOpen={menuOpen}
        />

        <div className="nav-user">
          {isLoggedIn ? (
            <div className="account-wrap">
              <div className="account-trigger">
                <span className="avatar">{profile.initials}</span>
                <span className="user-name">{profile.name}</span>
                <button className="logout-button" onClick={handleLogout}>Log out</button>
              </div>
              {accountMenuOpen && (
                <div className="account-menu">
                  <button onClick={() => { setAccountMenuOpen(false); navigate('/profile') }}>Profile</button>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <button className="auth-button" onClick={() => navigate('/login')}>Log in</button>
              <button className="auth-button signup-button" onClick={() => navigate('/register')}>Sign up</button>
            </div>
          )}
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="top" className="hero container landing-hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> PERSONAL STYLING STUDIO</span>
          <h1>Curate your<br /><em>everyday confidence.</em></h1>
          <p>Thoughtful outfits, tailored to your shape, your mood, and wherever the day takes you.</p>
          <a className="primary-button" href="/register">Start styling now <ArrowRight size={16} /></a>
          <div className="hero-foot">
            <div className="mini-avatars"><span>AM</span><span>JL</span><span>SK</span></div>
            <span>Join LookFit community styling with intention</span>
          </div>
        </div>
        <OutfitArt />
      </section>

      {/* COMMUNITY OUTFITS (LẤY TỪ BACKEND DATABASE) */}
      <Lookbook />

      {/* FOOTER */}
      <Footer />

      {/* BACK TO TOP BUTTON */}
      <button
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
      >
        <ArrowUp size={17} />
      </button>
    </main>
  );
}