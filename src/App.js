import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ── Canvas Scratch Reveal ─────────────────────────────────────────────────────
function ScratchCard({ src, alt, quote }) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || 340;
    const H = canvas.offsetHeight || 420;
    canvas.width  = W;
    canvas.height = H;

    // Simple, clean cream backdrop
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#f7ecd5');
    grad.addColorStop(0.5, '#eddfc0');
    grad.addColorStop(1, '#e8d5b0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Thin double border
    ctx.strokeStyle = 'rgba(184,150,62,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // Hint text
    const fs1 = Math.max(16, Math.round(W * 0.05));
    const fs2 = Math.max(11, Math.round(W * 0.032));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5c3d2e';
    ctx.font = `italic ${fs1}px 'Cormorant Garamond', Georgia, serif`;
    ctx.fillText('🤍  Barmağınızla cızın', W / 2, H / 2 - 10);
    ctx.fillStyle = 'rgba(92,61,46,0.6)';
    ctx.font = `300 ${fs2}px 'Lato', sans-serif`;
    ctx.fillText('sözləri aşkar etmək üçün', W / 2, H / 2 + fs1 * 0.2 + fs2 + 10);
  }, [revealed]);

  const checkPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transparent++; }
    const pct = (transparent / (canvas.width * canvas.height)) * 100;
    if (pct > 32) setRevealed(true);
  }, []);

  const scratchAt = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, Math.PI * 2);
    ctx.fill();
  }, [revealed]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  };

  const onStart = (e) => {
    drawing.current = true;
    const p = getPos(e);
    scratchAt(p.x, p.y);
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    scratchAt(p.x, p.y);
    checkPercent();
  };
  const onEnd = () => { drawing.current = false; checkPercent(); };

  return (
    <div className="scratch-wrap">
      {quote ? (
        <div className="scratch-base-quote">
          <span className="scratch-quote-mark">“</span>
          <p className="scratch-quote-text">{quote}</p>
          <span className="scratch-quote-mark end">”</span>
        </div>
      ) : (
        <img src={src} alt={alt} className="scratch-base-img" />
      )}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="scratch-canvas"
          onMouseDown={onStart} onMouseMove={onMove}
          onMouseUp={onEnd}   onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        />
      )}
    </div>
  );
}

// ── Scroll Reveal Wrapper ─────────────────────────────────────────────────────
function SR({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.unobserve(el); } },
      { threshold: 0.12, rootMargin: '0px 0px -28px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sr ${vis ? 'sr-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function CountdownTimer() {
  const wedding = new Date('2026-11-20T18:00:00+04:00');
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const d = wedding - new Date();
      if (d <= 0) return setT({ days:0, hours:0, minutes:0, seconds:0 });
      setT({
        days:    Math.floor(d / 86400000),
        hours:   Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000)  / 60000),
        seconds: Math.floor((d % 60000)    / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="timer-card">
      <div className="timer-eyebrow">Toy gününə qalan vaxt</div>
      <div className="timer-boxes">
        {[['days','Gün'],['hours','Saat'],['minutes','Dəq'],['seconds','San']].map(([k,l]) => (
          <div key={k} className="timer-box">
            <span className="timer-num">{String(t[k] ?? 0).padStart(2,'0')}</span>
            <span className="timer-sep" />
            <span className="timer-unit">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ornament ──────────────────────────────────────────────────────────────────
function Ornament() {
  return (
    <SR className="orn-wrap">
      <div className="ornament">
        <span className="orn-line" /><span className="orn-diamond">◆</span><span className="orn-line" />
      </div>
    </SR>
  );
}

// ── RSVP ─────────────────────────────────────────────────────────────────────
function RSVPSection() {
  const [name, setName]         = useState('');
  const [attending, setAttending] = useState('yes');
  const [guests, setGuests]     = useState(1);
  const [note, setNote]         = useState('');
  const [sent, setSent]         = useState(false);
  const [nameErr, setNameErr]   = useState(false);

  const handleSend = () => {
    if (!name.trim()) { setNameErr(true); return; }
    const msg = `🌿 Toy Dəvətnaməsi · İştirak Blankı\n\n` +
      `👤 Ad Soyad: ${name}\n` +
      `✦ İştirak: ${attending === 'yes' ? 'Bəli ✓' : 'Xeyr ✗'}\n` +
      `👥 Qonaq sayı: ${guests}\n` +
      `💬 Qeyd: ${note || '—'}\n\n` +
      `📅 Həmid & Elnurə · 20 Noyabr 2026`;
    window.open(`https://wa.me/994517497080?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(true);
  };

  if (sent) return (
    <div className="thank-card">
      <div className="thank-flourish">✦</div>
      <h3 className="thank-title">Təşəkkür edirik</h3>
      <p className="thank-text">İştirakınız bizə böyük sevinc gətirəcək.<br />Sizi 20 Noyabr günündə görmək arzusundayıq.</p>
      <div className="thank-sig">Həmid & Elnurə</div>
    </div>
  );

  return (
    <div className="rsvp-form">
      <div className="rsvp-orn"><span /><span className="rsvp-orn-diamond">◆</span><span /></div>
      <p className="rsvp-intro">İştirakınızı zəhmət olmasa əvvəlcədən təsdiqləyin</p>

      <div className="field-wrap">
        <label className="field-label">Ad, Soyad</label>
        <input
          className={`field-input ${nameErr ? 'field-err' : ''}`}
          value={name}
          onChange={e => { setName(e.target.value); setNameErr(false); }}
          placeholder="Adınızı daxil edin"
        />
        {nameErr && <span className="field-err-msg">Ad mütləqdir</span>}
      </div>

      <div className="field-wrap">
        <label className="field-label">İştirak</label>
        <div className="attend-row">
          <button
            type="button"
            className={`attend-btn ${attending === 'yes' ? 'sel' : ''}`}
            onClick={() => setAttending('yes')}
          >✓ Bəli, iştirak edəcəm</button>
          <button
            type="button"
            className={`attend-btn ${attending === 'no' ? 'sel' : ''}`}
            onClick={() => setAttending('no')}
          >✗ Təəssüf, edə bilmərəm</button>
        </div>
      </div>

      <div className="field-wrap">
        <label className="field-label">Qonaq sayı</label>
        <div className="stepper">
          <button type="button" className="step-btn" onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
          <span className="step-val">{guests}</span>
          <button type="button" className="step-btn" onClick={() => setGuests(g => Math.min(10, g + 1))}>+</button>
        </div>
      </div>

      <div className="field-wrap">
        <label className="field-label">Qeyd <span className="opt-lbl">(ixtiyari)</span></label>
        <textarea className="field-input field-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Xüsusi istəyiniz..." rows={3} />
      </div>

      <button className="rsvp-btn" onClick={handleSend}>Göndər <span>↗</span></button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark,    setIsDark]    = useState(false);
  const [imgFading, setImgFading] = useState(false);
  const audioRef = useRef(null);
  const [musicOn, setMusicOn] = useState(false);

  // Browsers block audio.play() until the visitor interacts with the page at
  // least once — there's no envelope-tap anymore, so catch the very first
  // interaction anywhere (tap, click, scroll, key) and start the music then.
  useEffect(() => {
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      audioRef.current?.play().then(() => setMusicOn(true)).catch(() => {});
      events.forEach(ev => window.removeEventListener(ev, start));
    };
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, start, { passive: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, start));
  }, []);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [showToggleHint, setShowToggleHint] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShowToggleHint(false), 3000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setShowScrollHint(false), 4000);
    const onScroll = () => setShowScrollHint(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(id); window.removeEventListener('scroll', onScroll); };
  }, []);

  const toggleTheme = useCallback(() => {
    setShowToggleHint(false);
    setImgFading(true);
    setTimeout(() => { setIsDark(d => !d); setImgFading(false); }, 380);
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) {
      audioRef.current.pause();
      setMusicOn(false);
    } else {
      audioRef.current.play()
        .then(() => setMusicOn(true))
        .catch(() => setMusicOn(false));
    }
  };

  return (
    <div className="app">
      <div className="bg-petals" aria-hidden>
        {[...Array(14)].map((_, i) => <div key={i} className={`petal petal-${i}`} />)}
      </div>

      <audio ref={audioRef} loop><source src="/music.mp3" type="audio/mpeg" /></audio>

      {/* Music btn — bottom right */}
      <button className="music-btn" onClick={toggleMusic} aria-label="Musiqi">
        {musicOn ? '♪' : '♩'}
      </button>

      {/* ── INVITATION ── */}
      <div className="invitation">

          {/* HERO */}
          <section className="hero-section">
            <div className="hero-img-wrap">
              <div className="hero-img-inner">
                {/* Single toggle button — top right */}
                <button className="dn-toggle" onClick={toggleTheme} aria-label="Gündüz / Gecə">
                  {isDark ? '☀️' : '🌙'}
                </button>

                <img src="/img1.jpg" alt="Gündüz"
                  className={`hero-img ${imgFading ? 'img-fading' : ''} ${isDark ? 'img-hide' : 'img-show'}`} />
                <img src="/img2.jpg" alt="Gecə"
                  className={`hero-img hero-abs ${imgFading ? 'img-fading' : ''} ${isDark ? 'img-show' : 'img-hide'}`} />

                {/* Tap hint — shows briefly so people notice the day/night toggle */}
                {showToggleHint && (
                  <div className="dn-hint" aria-hidden="true">
                    <span className="dn-hint-ring" />
                    <span className="dn-hint-finger">👆</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud-blended names at bottom of image */}
            <div className="hero-cloud-names">
              <div className="cloud-bg" />
              <div className="cloud-content">
                <div className="cloud-eyebrow">Toy Dəvətnaməsi</div>
                <h1 className="cloud-couple">
                  <span>Həmid</span>
                  <span className="cloud-amp">&</span>
                  <span>Elnurə</span>
                </h1>
                <div className="cloud-date">20 Noyabr 2026 · Cümə</div>
                <div className="cloud-venue">Bağçalı Saray</div>
              </div>
            </div>
          </section>

          {/* Fixed scroll-down indicator — visible until the user starts scrolling */}
          {showScrollHint && (
            <div className="scroll-hint" aria-hidden="true">
              <span className="scroll-hint-label">Aşağı Sürüşdürün</span>
              <div className="scroll-hint-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                  <path d="M12 3v16M12 19l-7-7M12 19l7-7" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}

          <Ornament />

          {/* TIMER */}
          <SR className="section timer-section">
            <CountdownTimer />
          </SR>

          <Ornament />

          {/* INVITATION QUOTE — scratch reveal */}
          <section className="section couple-section">
            <SR delay={100}>
              <ScratchCard quote="Sizi böyük məmnuniyyət hissi ilə toy mərasimimizin sevincini bizimlə bölüşməyə dəvət edirik" />
            </SR>
          </section>

          <Ornament />

          {/* DRESS CODE */}
          <section className="section">
            <SR><h2 className="section-title">Dress Code</h2></SR>
            <SR delay={120}>
              <div className="dresscode-card">
                <img src="/dresscode.png" alt="Dress Code" className="dc-img" />
                <div className="dc-theme-line">Elegant · Classic · Refined</div>
                <p className="dresscode-desc">
                  Bu xüsusi axşamın zərafətinə uyğun, zövqünüzə görə seçdiyiniz
                  zərif geyim kifayətdir.
                </p>
                <div className="dresscode-cols">
                  <div className="dc-col">
                    <div className="dc-col-title">Xanımlar</div>
                    <div className="dc-col-desc">Klassik və zərif axşam geyimi</div>
                  </div>
                  <div className="dc-div" />
                  <div className="dc-col">
                    <div className="dc-col-title">Cənablar</div>
                    <div className="dc-col-desc">Eleqant və klassik geyim</div>
                  </div>
                </div>
              </div>
            </SR>
          </section>

          <Ornament />

          {/* RSVP */}
          <section className="section">
            <SR><h2 className="section-title">İştirak Blankı</h2></SR>
            <SR delay={120}><RSVPSection /></SR>
          </section>

          <Ornament />

          {/* VENUE */}
          <section className="section">
            <SR><h2 className="section-title">Mərasim Yeri</h2></SR>
            <SR delay={120}>
              <div className="venue-card">
                <div className="venue-img-wrap">
                  <img src="/venue-bagcali.png" alt="Bağçalı Saray" className="venue-img venue-img-contain" />
                </div>
                <div className="venue-info">
                  <div className="venue-name">Bağçalı Saray</div>
                  <div className="venue-addr">Bakı şəhəri, Cəfər Xəndan 23C</div>
                  <div className="venue-time">20 Noyabr 2026 · Saat 18:00</div>
                  <div className="nav-label-top">Naviqasiya seçin</div>
                  <div className="nav-btns">
                    <a href="https://maps.app.goo.gl/xLpjFhhFycrRNfii8" target="_blank" rel="noreferrer" className="nav-btn"><span>🗺</span> Google Maps</a>
                    <a href="https://waze.com/ul?ll=40.4210797%2C49.8473155&navigate=yes" target="_blank" rel="noreferrer" className="nav-btn"><span>🔵</span> Waze</a>
                  </div>
                </div>
              </div>
            </SR>
          </section>

          {/* FOOTER */}
          <SR className="inv-footer">
            <div className="footer-flourish">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="footer-names">Həmid & Elnurə</div>
            <div className="footer-date">20 · XI · 2026</div>
            <div className="footer-verse">"Sevgi hər şeyi gözəlləşdirir"</div>
          </SR>

        </div>
    </div>
  );
}