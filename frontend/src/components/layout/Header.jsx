
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OutfitArt from '../home/OutfitArt'
import { ArrowRight, ArrowUp, Check, ChevronDown, CircleHelp, Heart, Menu, Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Header.css'
import Footer from "./Footer"
import Navigation from "./Navigation"
import Reviews from "../home/Reviews"
import Lookbook from "../home/Lookbook"

const initialItems = [
  { id: 'shirt', category: 'Essentials', name: 'White Oxford Shirt', detail: 'Cotton · Relaxed fit', emoji: '👕', tone: 'cream' },
  { id: 'skirt', category: 'Essentials', name: 'Navy A-line Skirt', detail: 'Wool blend · Midi length', emoji: '👗', tone: 'blue' },
  { id: 'shoes', category: 'Essentials', name: 'Black Leather Loafers', detail: 'Leather · Block heel', emoji: '👞', tone: 'lavender' },
  { id: 'bag', category: 'Accessories', name: 'Cognac Mini Tote', detail: 'Leather · Structured', emoji: '👜', tone: 'peach' },
]

const alternatives = {
  shirt: [initialItems[0], { id: 'shirt-2', category: 'Essentials', name: 'Silk Tie-Neck Blouse', detail: 'Silk · Soft drape', emoji: '👚', tone: 'pink' }, { id: 'shirt-3', category: 'Essentials', name: 'Fine Knit Polo', detail: 'Merino · Slim fit', emoji: '🧶', tone: 'sage' }],
  skirt: [initialItems[1], { id: 'skirt-2', category: 'Essentials', name: 'Cream Pleated Trousers', detail: 'Linen · Wide leg', emoji: '👖', tone: 'cream' }, { id: 'skirt-3', category: 'Essentials', name: 'Satin Slip Skirt', detail: 'Satin · Bias cut', emoji: '👗', tone: 'pink' }],
  shoes: [initialItems[2], { id: 'shoes-2', category: 'Essentials', name: 'Oxblood Ballet Flats', detail: 'Leather · Square toe', emoji: '🥿', tone: 'pink' }, { id: 'shoes-3', category: 'Essentials', name: 'Ivory Slingback Heels', detail: 'Leather · 55mm heel', emoji: '👠', tone: 'cream' }],
  bag: [initialItems[3], { id: 'bag-2', category: 'Accessories', name: 'Burgundy Shoulder Bag', detail: 'Leather · Gold hardware', emoji: '👛', tone: 'berry' }, { id: 'bag-3', category: 'Accessories', name: 'Canvas Market Tote', detail: 'Canvas · Everyday', emoji: '🛍️', tone: 'sage' }],
}

const contexts = ['Occasion', 'Style', 'Season', 'Weather', 'Lifestyle']


const editorialImages = {
  shirt: 'https://images.unsplash.com/photo-1608234807905-4466023792f5?auto=format&fit=crop&w=900&q=85',
  skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=85',
  shoes: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85',
  bag: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
}

function imageForItem(item) {
  return editorialImages[item.id.split('-')[0]] || editorialImages.shirt
}

function ItemCard({ item, onSwap, onRemove }) {
  return <article className="item-card">
    <div className={`item-visual tone-${item.tone}`}><img src={imageForItem(item)} alt={`${item.name} editorial product photo`} className="h-full w-full object-cover" /><button aria-label={`Remove ${item.name}`} className="remove" onClick={onRemove}><X size={14} /></button></div>
    <div className="item-info"><span className="item-category">{item.category === 'Essentials' ? 'Essential' : 'Accessory'}</span><h4>{item.name}</h4><p>{item.detail}</p><button className="swap-btn" onClick={onSwap}>Swap <ArrowRight size={13} /></button></div>
  </article>
}

export default function Page() {
  const {user, loading, isAuthenticated, isAdmin, logout } = useAuth()
  const [items, setItems] = useState(initialItems)
  const [activeContext, setActiveContext] = useState('Occasion')
  const [modalItem, setModalItem] = useState(null)
  const [published, setPublished] = useState(false)
  const [finalized, setFinalized] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Home')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [hasStartedStyling, setHasStartedStyling] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0);
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
    setActiveNav('Home');
    navigate('/');
  }
};

  const replaceItem = (item) => { setItems(current => current.map(existing => existing.id === modalItem?.id ? item : existing)); setModalItem(null) }
  const removeItem = (id) => setItems(current => current.filter(item => item.id !== id))

  return <main className="page">
     <nav className="nav container">
      <a className="brand" href="#top" aria-label="LookFit home"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lookfit-logo-new-SgG0KVJPTSg9JSHg2oL4vzSMpzFO80.png" alt="LookFit" /></a>
  <Navigation
  internal={isLoggedIn}
  menuOpen={menuOpen}
/>
      <div className="nav-user">
        {isLoggedIn ? <div className="account-wrap"><div className="account-trigger"><span className="avatar">{profile.initials}</span><span className="user-name">{profile.name}</span><button className="logout-button"

        onClick={handleLogout}
          >Log out</button></div>{accountMenuOpen && <div className="account-menu"><button onClick={() => { setAccountMenuOpen(false); navigate('/profile') }}>Profile</button><button onClick={handleLogout}>Log out</button></div>}</div> : <div className="auth-actions"><button className="auth-button" onClick={() => navigate('/login')}>Log in</button><button className="auth-button signup-button" onClick={() => navigate('/login?mode=signup')}>Sign up</button></div>}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
      </div>
    </nav>

    <section id="top" className="hero container landing-hero">
      <div className="hero-copy">
      <span className="eyebrow"><Sparkles size={14} /> PERSONAL STYLING STUDIO</span><h1>Curate your<br /><em>everyday confidence.</em></h1><p>Thoughtful outfits, tailored to your shape, your mood, and wherever the day takes you.</p><a className="primary-button" href="/login" onClick={() => setActiveNav('Styling studio')}>Start styling now <ArrowRight size={16} /></a><div className="hero-foot"><div className="mini-avatars"><span>AM</span><span>JL</span><span>SK</span></div><span>Join 2,400+ women styling with intention</span></div> </div>
<OutfitArt />
</section>

    {isLoggedIn ? <section id="studio" className="studio-section"><div className="container"><div className="dashboard-welcome"><div><span className="eyebrow">Welcome back, {profile.name}<span className="dot"></span> PERSONAL SPACE</span><h2>My wardrobe &amp; <em>quick styling studio.</em></h2><p>Pick from your saved pieces or let LookFit create a considered look for today.</p></div><div className="credit-card"><span>STYLE CREDITS</span><strong>240</strong><small>Ready to style</small></div></div><div className="wardrobe-strip"><div><span className="eyebrow">MY WARDROBE</span><strong>48 pieces</strong><small>4 new this month</small></div>{items.slice(0, 4).map(item => <button key={item.id} className={`wardrobe-piece tone-${item.tone}`} onClick={() => setModalItem(item)} aria-label={`Edit ${item.name}`}><span>{item.emoji}</span></button>)}<button className="wardrobe-add" onClick={() => setModalItem({ id: 'new', category: 'Essentials', name: 'Add wardrobe piece', detail: '', emoji: '＋', tone: 'cream' })}><Plus size={16} /><span>Add piece</span></button></div><div className="section-heading"><div><span className="eyebrow">THE STUDIO <span className="dot"></span> LOOK 08</span><h2>Build your <em>look.</em></h2></div><p className="section-intro">A considered edit for your real life. Tell us a little about today and we&apos;ll handle the rest.</p></div>
      <div className="context-bar"><div className="context-tabs">{contexts.map(context => <button key={context} className={activeContext === context ? 'selected' : ''} onClick={() => setActiveContext(context)}>{context}<span>{context === activeContext ? 'Everyday' : context === 'Season' ? 'Autumn' : context === 'Weather' ? 'Mild' : context === 'Lifestyle' ? 'On the go' : 'Smart casual'}</span><ChevronDown size={14} /></button>)}</div><button className="recommend-button" onClick={() => { setActiveNav('Styling studio'); setHasStartedStyling(true); document.getElementById('outfit')?.scrollIntoView({ behavior: 'smooth' }) }}><Sparkles size={15} /> Get recommendations</button></div>
      <div id="outfit" className="outfit-header"><div><span className="eyebrow">YOUR OUTFIT</span><h3>Made for your <em>moment.</em></h3></div><div className="match-badge"><strong>92%</strong><span>style match</span></div></div>
      <div className="outfit-grid"><div className="item-column"><div className="column-label"><span>01 — 03</span><strong>Essentials</strong></div>{items.filter(item => item.category === 'Essentials').map(item => <ItemCard key={item.id} item={item} onSwap={() => setModalItem(item)} onRemove={() => removeItem(item.id)} />)}</div><div className="item-column"><div className="column-label"><span>01 — 02</span><strong>Accessories</strong></div>{items.filter(item => item.category === 'Accessories').map(item => <ItemCard key={item.id} item={item} onSwap={() => setModalItem(item)} onRemove={() => removeItem(item.id)} />)}<button className="add-accessory" onClick={() => setModalItem({ id: 'new', category: 'Accessories', name: 'Add accessory', detail: '', emoji: '＋', tone: 'cream' })}><Plus size={18} /><span>Add accessory</span></button></div></div>
      <div className="stylist-note"><div className="note-icon">✦</div><div><span>STYLIST NOTE</span><p>A crisp foundation softened with warm cognac and a hint of structure. This look keeps you polished without trying too hard — perfect for a day that moves from desk to dinner.</p></div><button aria-label="More about stylist note"><CircleHelp size={17} /></button></div>
    </div></section>

    : <section id="reviews" className="testimonials-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">REAL STORIES <span className="dot"></span> LOOKFIT COMMUNITY</span><h2>Loved by women who <em>style with intention.</em></h2></div></div><div className="testimonial-infinite" aria-label="Customer testimonials"><div className="testimonial-marquee"><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-one">MR</span><div><strong>Maya R.</strong><span>Everyday stylist</span></div><span className="stars">★★★★★</span></div><p>“The recommendations feel surprisingly personal. I get dressed for work in minutes and still feel like myself.”</p><span className="testimonial-tag">5.0 · 92% style match</span></article><article className="testimonial-card featured"><div className="testimonial-top"><span className="testimonial-avatar avatar-two">EK</span><div><strong>Elena K.</strong><span>LookFit member</span></div><span className="stars">★★★★★</span></div><p>“The AI understands the mood I want before I even know how to name it.”</p><span className="testimonial-tag">5.0 · Styling made simple</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-three">JL</span><div><strong>Jules L.</strong><span>Community member</span></div><span className="stars">★★★★★</span></div><p>“Swapping one piece creates a whole new outfit. It is practical, thoughtful, and fun.”</p><span className="testimonial-tag">4.9 · Easy to use</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-one">NS</span><div><strong>Nora S.</strong><span>Creative director</span></div><span className="stars">★★★★½</span></div><p>“LookFit gives me fresh combinations without making my wardrobe feel complicated.”</p><span className="testimonial-tag">4.8 · Smart suggestions</span></article><article className="testimonial-card featured"><div className="testimonial-top"><span className="testimonial-avatar avatar-two">AC</span><div><strong>Ava C.</strong><span>LookFit member</span></div><span className="stars">★★★★★</span></div><p>“The interface is so calm and clear. I actually enjoy planning outfits now.”</p><span className="testimonial-tag">5.0 · Effortless planning</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-three">TW</span><div><strong>Talia W.</strong><span>Weekend stylist</span></div><span className="stars">★★★★★</span></div><p>“It nailed my proportions and suggested pieces I already own in new ways.”</p><span className="testimonial-tag">5.0 · 94% style match</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-one">IB</span><div><strong>Isla B.</strong><span>LookFit member</span></div><span className="stars">★★★★½</span></div><p>“The daily edits save time and make getting ready feel much more intentional.�����</p><span className="testimonial-tag">4.7 · Daily inspiration</span></article><article className="testimonial-card featured"><div className="testimonial-top"><span className="testimonial-avatar avatar-two">SM</span><div><strong>Sofia M.</strong><span>Community member</span></div><span className="stars">★★★★★</span></div><p>“I found my signature style faster than I expected. Every recommendation feels considered.”</p><span className="testimonial-tag">5.0 · Personal feel</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-three">RK</span><div><strong>Rina K.</strong><span>Everyday stylist</span></div><span className="stars">★★★★★</span></div><p>“The outfit builder is intuitive, beautiful, and genuinely useful on busy mornings.”</p><span className="testimonial-tag">5.0 · Beautifully simple</span></article><article className="testimonial-card"><div className="testimonial-top"><span className="testimonial-avatar avatar-one">DP</span><div><strong>Dana P.</strong><span>LookFit member</span></div><span className="stars">★★★★½</span></div><p>“I love how accurately it balances comfort, color, and the occasion I choose.”</p><span className="testimonial-tag">4.9 · Thoughtful AI</span></article></div></div><div className="legacy-testimonials" aria-hidden="true"><button className="carousel-arrow" onClick={() => setReviewIndex((reviewIndex + 2) % 3)} aria-label="Previous review">‹</button><div className="testimonial-viewport"><div className="testimonial-track" style={{ opacity: 1 }}><article className="testimonial-card" style={{ display: reviewIndex === 0 ? 'block' : 'none' }}><div className="testimonial-top"><span className="testimonial-avatar avatar-one">MR</span><div><strong>Maya R.</strong><span>Everyday stylist</span></div><span className="stars">★★★★★</span></div><p>“The recommendations feel surprisingly personal. I can get dressed for work in minutes and still feel completely like myself.”</p><span className="testimonial-tag">92% style match</span></article><article className="testimonial-card featured" style={{ display: reviewIndex === 1 ? 'block' : 'none' }}><div className="testimonial-top"><span className="testimonial-avatar avatar-two">EK</span><div><strong>Elena K.</strong><span>LookFit member</span></div><span className="stars">★★★★★</span></div><p>“LookFit turned my wardrobe into a calm little studio. The AI understands the mood I want before I even know how to name it.”</p><span className="testimonial-tag">Styling made simple</span></article><article className="testimonial-card" style={{ display: reviewIndex === 2 ? 'block' : 'none' }}><div className="testimonial-top"><span className="testimonial-avatar avatar-three">JL</span><div><strong>Jules L.</strong><span>Community member</span></div><span className="stars">★★★★★</span></div><p>“I love how easy it is to swap one piece and see a whole new outfit. It is practical, thoughtful, and actually fun.”</p><span className="testimonial-tag">4.9 / 5 experience</span></article></div></div><button className="carousel-arrow" onClick={() => setReviewIndex((reviewIndex + 1) % 3)} aria-label="Next review">›</button></div><div className="carousel-dots" aria-label="Review navigation">{[0, 1, 2].map(index => <button key={index} className={reviewIndex === index ? 'active' : ''} onClick={() => setReviewIndex(index)} aria-label={`Show review ${index + 1}`} />)}</div><div className="testimonial-cta"><p>Ready to make getting dressed feel more like you?</p><a className="primary-button" href="/auth">Begin your style journey <ArrowRight size={16} /></a></div></div></section>}

<Lookbook />
<Footer />
    {isLoggedIn && activeNav === 'Styling studio' && hasStartedStyling && <footer className="action-bar"><div className="container action-inner"><div className="save-status"><span className="saved-dot"><Check size={12} /></span><span>All changes saved <small>(Draft — Look 08)</small></span></div><label className="publish-toggle"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /><span className="checkmark"></span> Publish to community feed</label><button className={`finalize-button ${finalized ? 'done' : ''}`} onClick={() => setFinalized(true)}>{finalized ? <><Check size={16} /> Outfit finalized</> : <>Finalize outfit <ArrowRight size={16} /></>}</button></div></footer>}


<button
  className={`back-to-top ${showBackToTop ? "visible" : ""}`}
  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  aria-label="Back to top"
  aria-hidden={!showBackToTop}
  tabIndex={showBackToTop ? 0 : -1}
>
  <ArrowUp size={17} />
</button>

    {modalItem && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Swap an item" onClick={() => setModalItem(null)}><div className="swap-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">EDIT YOUR LOOK</span><h3>Swap {modalItem.name}</h3></div><button onClick={() => setModalItem(null)} aria-label="Close"><X size={19} /></button></div><div className="modal-grid">{(alternatives[modalItem.id] || alternatives.shirt).map(item => <button className="alternative" key={item.id} onClick={() => replaceItem(item)}><div className={`item-visual tone-${item.tone}`}><span>{item.emoji}</span></div><strong>{item.name}</strong><small>{item.detail}</small>{item.id === modalItem.id && <span className="current"><Check size={12} /> Current</span>}</button>)}</div></div></div>}
  </main>
}
