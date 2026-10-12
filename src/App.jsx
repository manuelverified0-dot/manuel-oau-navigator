import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRight, BookOpen, Building2, Check, ChevronDown, Compass, GraduationCap, Landmark, MapPin, Menu, Navigation, Search, ShieldCheck, Smartphone, Users, X, CircleHelp, Send, Clock3 } from 'lucide-react';
import { PLACES_NORMALIZED, LOCATION_STATUS } from './data/places';
import LiveNavigation from './LiveNavigation.jsx';

// Replace with your WhatsApp number in international format, without + or spaces.
const WHATSAPP_NUMBER = '2348071887415';
const WHATSAPP_MESSAGE = 'Hello MANUEL OAU NAVIGATOR, I need help finding a location on OAU campus.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const ALL_PLACES = PLACES_NORMALIZED;
const CATEGORIES = ['All places', ...new Set(ALL_PLACES.map((place) => place.category))];
const iconFor = (category) => category.includes('Library') ? BookOpen : category.includes('Facult') || category.includes('Academic') ? GraduationCap : category.includes('Administrative') ? Landmark : category.includes('Sports') ? Users : category.includes('Gate') || category.includes('Transport') ? MapPin : Building2;

function BrandMark() { return <span className="brand-mark" aria-hidden="true"><MapPin size={33} strokeWidth={2.1} /><b>M</b></span>; }
function App() {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All places');
  const [route, setRoute] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionDetails, setSuggestionDetails] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState('');
  const [adminMode, setAdminMode] = useState(new URLSearchParams(window.location.search).get('admin') === '1');
  const [suggestions, setSuggestions] = useState(() => { try { return JSON.parse(localStorage.getItem('manuel-oau-place-suggestions') || '[]'); } catch { return []; } });

  const filteredPlaces = useMemo(() => ALL_PLACES.filter((place) => {
    const matchesCategory = category === 'All places' || place.category === category;
    const text = `${place.name} ${place.aliases.join(' ')} ${place.category} ${place.subcategory} ${place.description} ${place.campusZone}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase().trim());
  }), [category, query]);
  const placeById = (id) => ALL_PLACES.find((place) => place.id === id);

  function showRoute(event) {
    event.preventDefault();
    if (!start || !destination) { setMessage('Choose both a starting point and a destination to continue.'); setRoute(null); return; }
    if (start === destination) { setMessage('Your starting point and destination are the same. Choose a different destination.'); setRoute(null); return; }
    setRoute({ from: start === '__gps__' ? { id: '__gps__', name: 'My GPS location' } : placeById(start), to: placeById(destination) }); setMessage('');
  }
  function selectDestination(place) {
    setDestination(place.id); setRoute(null); setMessage(`${place.name} selected. Choose your starting point, then show the available directions.`);
    document.getElementById('route-finder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function swapLocations() { setStart(destination); setDestination(start); setRoute(null); setMessage(''); }
  function directionsUrl() {
    if (!route?.from || !route?.to) return '#';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${route.from.name}, Obafemi Awolowo University, Ile-Ife, Nigeria`)}&destination=${encodeURIComponent(`${route.to.name}, Obafemi Awolowo University, Ile-Ife, Nigeria`)}&travelmode=walking`;
  }
  function submitSuggestion(event) {
    event.preventDefault();
    const name = suggestionName.trim();
    if (!name) { setSuggestionStatus('Please enter the location name.'); return; }
    const entry = { id: `suggestion-${Date.now()}`, name, details: suggestionDetails.trim(), status: 'pending_review', submittedAt: new Date().toISOString() };
    const next = [entry, ...suggestions]; setSuggestions(next);
    try { localStorage.setItem('manuel-oau-place-suggestions', JSON.stringify(next)); } catch { /* Storage may be disabled; the form still confirms submission for this session. */ }
    setSuggestionName(''); setSuggestionDetails(''); setSuggestionStatus('Suggestion saved in this browser for review. It is not published as a confirmed location.');
  }
  function reviewSuggestion(id, approve) {
    const next = suggestions.map((item) => item.id === id ? { ...item, status: approve ? 'reviewed_needs_data' : 'declined' } : item);
    setSuggestions(next); try { localStorage.setItem('manuel-oau-place-suggestions', JSON.stringify(next)); } catch { /* ignore */ }
  }

  return <div className="site-shell">
    <header className="navbar">
      <a className="brand" href="#home" aria-label="MANUEL OAU NAVIGATOR home"><BrandMark /><span><strong>MANUEL OAU</strong><small>NAVIGATOR</small></span></a>
      <button className="mobile-menu-toggle" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button>
      <nav className={mobileMenu ? 'nav-links open' : 'nav-links'} aria-label="Main navigation"><a href="#home" onClick={() => setMobileMenu(false)}>Home</a><a href="#explore" onClick={() => setMobileMenu(false)}>Explore Places</a><a href="#how-it-works" onClick={() => setMobileMenu(false)}>How It Works</a><a href="#about" onClick={() => setMobileMenu(false)}>About</a><a className="button button-green nav-contact" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Smartphone size={17} /> Chat With Us</a></nav>
    </header>
    <main>
      <section className="hero section-wrap" id="home"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR THE OAU COMMUNITY</div><h1>Never get lost<br />around <em>OAU.</em></h1><p className="hero-description">Search a growing directory of campus buildings, halls, academic facilities and services. Use available external directions while location data is being verified.</p><div className="hero-actions"><a className="button button-green" href="#route-finder">Find a Destination <ArrowRight size={18} /></a><a className="button button-light" href="#explore">Explore Campus</a></div><div className="hero-note"><ShieldCheck size={17} /><span>{ALL_PLACES.length} directory entries · location verification in progress</span></div></div>
        <div className="hero-art" aria-label="Campus navigation illustration"><div className="art-glow" /><div className="art-card art-card-top"><span className="art-icon"><MapPin size={19}/></span><span><strong>Search by name or alias</strong><small>Try Awo, Faj, CSL or AUD II</small></span><Check size={18} className="art-check" /></div><div className="campus-illustration"><div className="sun"/><div className="tree tree-one"/><div className="tree tree-two"/><div className="building building-back"/><div className="building building-main"><div className="building-roof"/><div className="building-windows"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="building-door"/></div><div className="pathway"/><div className="map-pin-art"><MapPin size={28} fill="currentColor"/><span /></div></div><div className="art-card art-card-bottom"><span className="mini-route"><i/><b/><i/></span><span><strong>Coverage grows with verified data</strong><small>No made-up distances or GPS pins</small></span></div></div>
      </section>
      <section className="route-section section-wrap" id="route-finder"><div className="section-heading"><span className="section-kicker">YOUR NEXT STOP</span><h2>Where do you want to go?</h2><p>Choose your GPS location or a listed starting point, then calculate a pedestrian route on the embedded map when map data supports it.</p></div>
        <form className="route-card" onSubmit={showRoute}><div className="route-fields"><label className="field"><span className="field-label"><i className="start-dot"/> Starting Point <small>Where are you now?</small></span><span className="select-wrap"><select value={start} onChange={(e) => { setStart(e.target.value); setMessage(''); }} aria-label="Starting point"><option value="">Choose a starting point</option><option value="__gps__">Use my current GPS location</option>{ALL_PLACES.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select><ChevronDown size={18}/></span></label><button type="button" className="swap-button" onClick={swapLocations} aria-label="Swap starting point and destination" title="Swap locations"><ArrowDownUp size={19}/></button><label className="field"><span className="field-label"><i className="end-dot"/> Destination <small>Where do you want to go?</small></span><span className="select-wrap"><select value={destination} onChange={(e) => { setDestination(e.target.value); setMessage(''); }} aria-label="Destination"><option value="">Choose a destination</option>{ALL_PLACES.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select><ChevronDown size={18}/></span></label></div><div className="route-bottom"><span className="route-disclaimer"><Compass size={17}/> GPS + pedestrian routing · map coverage may vary.</span><button className="button button-green route-submit" type="submit">Show My Route <ArrowRight size={18}/></button></div>{message && <p className="form-message" role="status">{message}</p>}</form>
        {route && <LiveNavigation startPlace={route.from} destinationPlace={route.to} onEnd={() => setMessage('Navigation ended. Choose a new route whenever you are ready.')} />}
      </section>
      <section className="explore-section section-wrap" id="explore"><div className="section-heading section-heading-row"><div><span className="section-kicker">GROWING CAMPUS DIRECTORY</span><h2>Explore campus places</h2><p>Search official names, common abbreviations and alternate names. Status labels distinguish source-backed names from locations still needing a precise check.</p></div><span className="place-count">{ALL_PLACES.length} entries</span></div><div className="explore-tools"><label className="directory-search"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, aliases, faculties..." aria-label="Search campus directory" /></label><label className="category-select"><span className="sr-only">Filter by category</span><select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select><ChevronDown size={17}/></label></div>
        {filteredPlaces.length ? <div className="place-grid">{filteredPlaces.map((place) => { const Icon = iconFor(place.category); return <article className="place-card" key={place.id}><div className="place-card-top"><span className="place-icon"><Icon size={21}/></span><span className={`status-pill ${place.status === 'verified_name' ? 'status-source' : ''}`}>{LOCATION_STATUS[place.status]?.label || 'Location to verify'}</span></div><span className="category-label">{place.category}</span><h3>{place.name}</h3><p>{place.description}</p>{place.aliases.length > 0 && <div className="aliases">Also searched as: {place.aliases.slice(0,3).join(', ')}</div>}<button className="text-link" onClick={() => selectDestination(place)}>Use as destination <ArrowRight size={16}/></button></article>; })}</div> : <div className="empty-state"><Search size={26}/><strong>No places found</strong><p>Try another name or abbreviation, or suggest a missing location below.</p><button className="text-link" onClick={() => { setQuery(''); setCategory('All places'); }}>Clear filters</button></div>}
      </section>
      <section className="suggest-section" id="suggest-place"><div className="section-wrap suggest-layout"><div><span className="section-kicker">HELP EXPAND THE DIRECTORY</span><h2>Can’t find your destination?</h2><p>Suggest a campus location that should be added. Suggestions are saved in this browser for review and are not automatically added to the public directory.</p><div className="suggest-note"><ShieldCheck size={18}/> Every new place needs a name check and location verification before routing can be enabled.</div></div><form className="suggest-form" onSubmit={submitSuggestion}><label>Location name<input value={suggestionName} onChange={(e) => setSuggestionName(e.target.value)} required maxLength={120} placeholder="e.g. a department or lecture hall" /></label><label>Extra details (optional)<textarea value={suggestionDetails} onChange={(e) => setSuggestionDetails(e.target.value)} maxLength={500} rows={3} placeholder="Nearby landmark, alternate name, or how you know it..." /></label><button className="button button-green" type="submit"><Send size={16}/> Submit for review</button>{suggestionStatus && <p className="form-message" role="status">{suggestionStatus}</p>}</form></div></section>
      <section className="how-section" id="how-it-works"><div className="section-wrap"><div className="section-heading"><span className="section-kicker">THREE SIMPLE STEPS</span><h2>Getting there starts here.</h2><p>Choose a start and destination, grant GPS permission if using live tracking, then follow mapped pedestrian directions.</p></div><div className="steps-grid"><article className="step-card"><span className="step-number">01</span><span className="step-icon"><MapPin size={23}/></span><h3>Choose your location</h3><p>Select your starting point from the searchable campus directory.</p></article><article className="step-card"><span className="step-number">02</span><span className="step-icon"><Search size={23}/></span><h3>Pick your destination</h3><p>Search for a faculty, hostel, service, library or landmark.</p></article><article className="step-card"><span className="step-number">03</span><span className="step-icon"><Navigation size={23}/></span><h3>Follow available directions</h3><p>Check the map result carefully until verified campus route data is added.</p></article></div></div></section>
      <section className="about-section section-wrap" id="about"><div className="about-mark"><BrandMark /></div><div className="about-copy"><span className="section-kicker">ABOUT THE PROJECT</span><h2>A campus directory built to grow responsibly.</h2><p>MANUEL OAU NAVIGATOR is an independent campus navigation project for students and visitors at Obafemi Awolowo University, Ile-Ife. It is not an official university service. Public university pages and map references help seed this directory, but the campus changes over time and a name appearing here does not mean its coordinates or route are verified. The next step toward dependable directions is a reviewed campus map dataset with building pins, accessible entrances and walkable paths.</p><a className="text-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contact us with a correction <ArrowRight size={16}/></a></div></section>
      <section className="admin-section section-wrap"><button className="text-link" onClick={() => setAdminMode(!adminMode)}><ShieldCheck size={16}/>{adminMode ? 'Hide local review queue' : 'Open local suggestion review'} <ArrowRight size={15}/></button>{adminMode && <div className="review-panel"><h3>Local suggestion review queue</h3><p>This queue is stored only in this browser. It is not a secure, shared admin dashboard; do not use it for sensitive information.</p>{suggestions.length ? suggestions.map((item) => <article className="review-item" key={item.id}><div><strong>{item.name}</strong><p>{item.details || 'No extra details supplied.'}</p><small>Status: {item.status.replaceAll('_',' ')}</small></div>{item.status === 'pending_review' && <div className="review-actions"><button className="button button-light" onClick={() => reviewSuggestion(item.id, false)}>Decline</button><button className="button button-green" onClick={() => reviewSuggestion(item.id, true)}>Mark reviewed</button></div>}</article>) : <p>No suggestions have been submitted in this browser yet.</p>}</div>}</section>
    </main>
    <footer className="footer"><div className="footer-main"><a className="brand footer-brand" href="#home"><BrandMark/><span><strong>MANUEL OAU</strong><small>NAVIGATOR</small></span></a><p>Find Your Way Around OAU.</p><a className="button button-outline" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Smartphone size={17}/> Contact on WhatsApp</a></div><div className="footer-bottom"><span>© 2026 MANUEL OAU NAVIGATOR. Built for easier campus navigation.</span><a href="#home">Back to top ↑</a></div></footer>
    <a className="floating-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Contact MANUEL OAU NAVIGATOR on WhatsApp"><Smartphone size={22}/><span>WhatsApp</span></a>
  </div>;
}
export default App;
