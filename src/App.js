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

    // Soft light radial backdrop
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.15);
    grad.addColorStop(0, '#faf3e8');
    grad.addColorStop(0.6, '#f3e6cc');
    grad.addColorStop(1, '#ecd9b3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Scattered gold diamond texture
    ctx.fillStyle = 'rgba(184,150,62,0.13)';
    const step = 32;
    for (let y = 12; y < H; y += step) {
      const rowOffset = (Math.round(y / step) % 2) * (step / 2);
      for (let x = 12; x < W; x += step) {
        ctx.save();
        ctx.translate(x + rowOffset, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }
    }

    // Double gold frame
    ctx.strokeStyle = 'rgba(184,150,62,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(14.5, 14.5, W - 29, H - 29);
    ctx.strokeStyle = 'rgba(184,150,62,0.28)';
    ctx.strokeRect(20.5, 20.5, W - 41, H - 41);

    const cy = H / 2 - 6;

    // Flourish lines flanking the monogram
    ctx.strokeStyle = 'rgba(184,150,62,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 96, cy);
    ctx.lineTo(W / 2 - 38, cy);
    ctx.moveTo(W / 2 + 38, cy);
    ctx.lineTo(W / 2 + 96, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2 - 34, cy, 2.5, 0, Math.PI * 2);
    ctx.arc(W / 2 + 34, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(184,150,62,0.85)';
    ctx.fill();

    // Monogram
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c1810';
    ctx.font = `400 42px 'Cormorant Garamond', Georgia, serif`;
    ctx.fillText('H  &  E', W / 2, cy);

    // Sub label
    ctx.fillStyle = 'rgba(92,61,46,0.75)';
    ctx.font = `11px 'Cinzel', serif`;
    ctx.fillText('C I Z A R A Q   A Ç I N', W / 2, cy + 36);
  }, [revealed]);

  const checkPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transparent++; }
    const pct = (transparent / (canvas.width * canvas.height)) * 100;
    if (pct > 52) setRevealed(true);
  }, []);

  const scratchAt = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
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
  const [envOpen,   setEnvOpen]   = useState(false);
  const [content,   setContent]   = useState(false);
  const [isDark,    setIsDark]    = useState(false);
  const [imgFading, setImgFading] = useState(false);
  const audioRef = useRef(null);
  const [musicOn, setMusicOn] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [showToggleHint, setShowToggleHint] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!content) return;
    const id = setTimeout(() => setShowToggleHint(false), 3000);
    return () => clearTimeout(id);
  }, [content]);

  useEffect(() => {
    if (!content) return;
    const id = setTimeout(() => setShowScrollHint(false), 4000);
    const onScroll = () => setShowScrollHint(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(id); window.removeEventListener('scroll', onScroll); };
  }, [content]);

  const handleEnvTap = () => {
    if (videoPlaying) return;
    setVideoPlaying(true);
    const p = videoRef.current?.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => handleVideoEnd()); // couldn't play — don't get stuck
    }
    // Start the invitation's own music right away, using this same tap gesture
    audioRef.current?.play().then(() => setMusicOn(true)).catch(() => {});
  };

  const handleVideoEnd = () => {
    setEnvOpen(true);
    setTimeout(() => setContent(true), 700);
  };

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
      {content && (
        <button className="music-btn" onClick={toggleMusic} aria-label="Musiqi">
          {musicOn ? '♪' : '♩'}
        </button>
      )}

      {/* ── ENVELOPE — tap full screen to play the letter video ── */}
      {!content && (
        <div
          className={`env-scene ${envOpen ? 'opening' : ''}`}
          onClick={handleEnvTap}
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/envelope-bg.jpg)` }}
        >
          <video
            ref={videoRef}
            src="/video.mp4"
            playsInline
            preload="auto"
            webkit-playsinline="true"
            className={`env-video ${videoPlaying ? 'active' : ''}`}
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlayThrough={() => setVideoLoaded(true)}
            onEnded={handleVideoEnd}
            onError={handleVideoEnd}
          />
          {!videoLoaded && !videoPlaying && (
            <div className="env-spinner-wrap"><div className="env-spinner" /></div>
          )}
          {!videoPlaying && videoLoaded && (
            <div className="env-cta">
              <span className="env-orn">✦</span>
              <div className="env-label">Məktuba toxunun</div>
              <span className="env-orn">✦</span>
            </div>
          )}
        </div>
      )}

      {/* ── INVITATION ── */}
      {content && (
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
              <span className="scroll-hint-label">Sürüşdürün</span>
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
                <img src="/dresscode.jpg" alt="Dress Code" className="dc-img" />
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
                  <img src="/img5.jpg" alt="Şadlıq Sarayı" className="venue-img" />
                </div>
                <div className="venue-info">
                  <div className="venue-name">Bağçalı Saray</div>
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
      )}
    </div>
  );
}