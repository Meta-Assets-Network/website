import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { translations } from './translations';
import { WalletModal } from './WalletModal';
import { useAccount } from 'wagmi';

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [aboutActive, setAboutActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [p4idx, setP4idx] = useState(0);
  const [ppSlide, setPpSlide] = useState(0);
  const [ppAutoPaused, setPpAutoPaused] = useState(false);
  const ppResumeTimer = useRef(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typewriterRef = useRef(null);
  const { address, isConnected } = useAccount();

  const t = translations[lang];


  // Typewriter effect
  useEffect(() => {
    const texts = translations[lang]['p3.typewriter'];
    let ti = 0, ci = 0;

    const type = () => {
      const txt = texts[ti];
      if (ci < txt.length) {
        setTypewriterText(txt.substring(0, ci + 1));
        ci++;
        typewriterRef.current = setTimeout(type, 80 + Math.random() * 50);
      } else {
        typewriterRef.current = setTimeout(() => {
          setTypewriterText('');
          ci = 0;
          ti = (ti + 1) % texts.length;
          type();
        }, 2000);
      }
    };

    typewriterRef.current = setTimeout(type, 1500);
    return () => clearTimeout(typewriterRef.current);
  }, [lang]);

  // P4 carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setP4idx(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleComingSoon = (e) => {
    e.preventDefault();
    setModalActive(true);
    setTimeout(() => setModalActive(false), 1000);
  };

  const handleAbout = (e) => {
    e.preventDefault();
    setAboutActive(true);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMenus = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  const p4update = (idx) => {
    setP4idx(idx);
  };

  const phoneImgs = ['/images/super-wallet.png', '/images/macswap.png', '/images/rwa.png', '/images/clawmask.png'];

  const partners = [
    { name: 'USDC', icon: '/images/usdc.png', href: 'https://www.usdc.com/', descKey: 'pp.p1desc' },
    { name: 'Habsburg', icon: '/images/habsburg.png', href: 'https://habsburg.org/', descKey: 'pp.p2desc' },
    { name: 'TheMastera', icon: '/images/themastera.png', href: 'https://themastera.xyz', descKey: 'pp.p3desc' },
    { name: 'BiFu', icon: '/images/bifu.png', href: 'https://www.bifu.co', descKey: 'pp.p4desc' },
    { name: 'WDCB', icon: '/images/wdcb.png', href: 'https://wdcb.vip/', descKey: 'pp.p5desc' },
    { name: 'Chainlink', icon: '/images/chainlink.png', href: 'https://chain.link', descKey: 'pp.p6desc' },
  ];
  // 补齐为偶数：奇数时末尾克隆第一张，确保每屏完整 2 张
  const ppItems = partners.length % 2 === 0 ? partners : [...partners, partners[0]];
  const PP_SLIDES = ppItems.length / 2;

  // 钱包生态合作伙伴（第二轮播）
  const walletPartners = [
    { name: 'TokenPocket', icon: '/images/tokenpocket.png', href: 'https://www.tokenpocket.pro/', descKey: 'pp.wp1desc' },
    { name: 'MetaMask', icon: '/images/metamask.svg', href: 'https://metamask.io/', descKey: 'pp.wp2desc' },
    { name: 'imToken', icon: '/images/imtoken.svg', href: 'https://token.im/', descKey: 'pp.wp3desc' },
    { name: 'Trust Wallet', icon: '/images/trustwallet.svg', href: 'https://trustwallet.com/', descKey: 'pp.wp4desc' },
    { name: 'OKX Wallet', icon: '/images/okx-wallet.svg', href: 'https://www.okx.com/web3', descKey: 'pp.wp5desc' },
  ];
  const wpItems = walletPartners.length % 2 === 0 ? walletPartners : [...walletPartners, walletPartners[0]];
  const WP_SLIDES = wpItems.length / 2;
  const [wpSlide, setWpSlide] = useState(0);
  const [wpAutoPaused, setWpAutoPaused] = useState(false);
  const wpResumeTimer = useRef(null);

  // 生态合作伙伴自动轮播：循环到最后一个后从头开始，用户操作后暂停 5 秒再恢复
  useEffect(() => {
    if (ppAutoPaused || PP_SLIDES <= 1) return;
    const timer = setTimeout(() => {
      setPpSlide(prev => (prev + 1) % PP_SLIDES);
    }, 4000);
    return () => clearTimeout(timer);
  }, [PP_SLIDES, ppSlide, ppAutoPaused]);

  const ppGo = (idx) => {
    setPpSlide(((idx % PP_SLIDES) + PP_SLIDES) % PP_SLIDES);
    setPpAutoPaused(true);
    clearTimeout(ppResumeTimer.current);
    ppResumeTimer.current = setTimeout(() => setPpAutoPaused(false), 5000);
  };

  // 钱包生态合作伙伴自动轮播
  useEffect(() => {
    if (wpAutoPaused || WP_SLIDES <= 1) return;
    const timer = setTimeout(() => {
      setWpSlide(prev => (prev + 1) % WP_SLIDES);
    }, 4000);
    return () => clearTimeout(timer);
  }, [WP_SLIDES, wpSlide, wpAutoPaused]);

  const wpGo = (idx) => {
    setWpSlide(((idx % WP_SLIDES) + WP_SLIDES) % WP_SLIDES);
    setWpAutoPaused(true);
    clearTimeout(wpResumeTimer.current);
    wpResumeTimer.current = setTimeout(() => setWpAutoPaused(false), 5000);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="top-nav">
        <a href="#hero" className="top-nav-logo">
          <img src="/images/logo.png" alt="META ASSETS" />
          <span>META ASSETS</span>
        </a>
        <div className={`menu-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}></div>
        <div className={`top-nav-links ${menuOpen ? 'open' : ''}`} id="nav-links">
          {/* 网络 / Network */}
          <div className={`nav-dropdown ${openDropdown === 'network' ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('network'); } }}>
              {t['nav.network']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.mainnet']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.testnet']}</a>
              <a href="https://ma-chain.xyz/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.block_explorer']}</a>
            </div>
          </div>
          {/* 门户 / Portal */}
          <div className={`nav-dropdown ${openDropdown === 'portal' ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('portal'); } }}>
              {t['nav.portal']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.super_wallet']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.macswap']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.macbridge']}</a>
              <a href="https://clawservice.metaassetschain.org/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.clawmask_portal']}</a>
            </div>
          </div>
          {/* 质押 / Meta Pool */}
          <div className={`nav-dropdown ${openDropdown === 'metapool' ? 'open' : ''}`}>
            <a href="https://macpool.net/" className="top-nav-link nav-dropdown-trigger top-nav-link-accent" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('metapool'); } }}>
              {t['nav.metapool']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="https://macpool.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.staking']}</a>
              <a href="https://macpool.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.compute_provider']}</a>
            </div>
          </div>
          {/* 文档 / Docs */}
          <div className={`nav-dropdown ${openDropdown === 'docs' ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('docs'); } }}>
              {t['nav.docs']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <Link to="/whitepaper-technical" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.wp_technical']}</Link>
              <Link to="/tokenomics" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.wp_tokenomics']}</Link>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.dev_docs']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.api_sdk']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.faq']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.media_kit']}</a>
            </div>
          </div>
          {/* 生态 / Ecosystem */}
          <div className={`nav-dropdown ${openDropdown === 'eco' ? 'open' : ''}`}>
            <a href="#page-partners" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('eco'); } }}>
              {t['nav.ecosystem']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="#page-partners" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.eco_projects']}</a>
            </div>
          </div>
          {/* 社区 / Community */}
          <div className={`nav-dropdown ${openDropdown === 'community' ? 'open' : ''}`}>
            <a href="#page-events" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('community'); } }}>
              {t['nav.community']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="#page-events" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.events']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.ambassador']}</a>
            </div>
          </div>
          <div className="lang-segmented lang-switch-mobile">
            <button className={`lang-seg ${lang === 'en' ? 'active' : ''}`} onClick={() => { if (lang !== 'en') toggleLang(); }}>EN</button>
            <button className={`lang-seg ${lang === 'zh' ? 'active' : ''}`} onClick={() => { if (lang !== 'zh') toggleLang(); }}>中文</button>
          </div>
        </div>
        <div className="lang-segmented lang-switch-desktop">
          <button className={`lang-seg ${lang === 'en' ? 'active' : ''}`} onClick={() => { if (lang !== 'en') toggleLang(); }}>EN</button>
          <button className={`lang-seg ${lang === 'zh' ? 'active' : ''}`} onClick={() => { if (lang !== 'zh') toggleLang(); }}>中文</button>
        </div>
        <button className="wallet-btn top-nav-wallet" onClick={() => setWalletModalOpen(true)}>
          {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : t['nav.wallet']}
        </button>
        <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* Page 1: Hero */}
      <div className="hero-section" id="hero">
        <iframe className="hero-anim" src="/anim/anim-hero.html" title="MA Animation"></iframe>
        <div className="hero-content">
          <h1 className="hero-title">
            {t['hero.title'].split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </h1>
          <div className="hero-stats-bar">
            <div className="hero-stat-item">
              <div className="hero-stat-value">50K+</div>
              <div className="hero-stat-label">{t['stats.nodes'].replace(/[：:]/g, '')}</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">10M+</div>
              <div className="hero-stat-label">TPS</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">1M+</div>
              <div className="hero-stat-label">{t['stats.users'].replace(/[：:]/g, '')}</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">$2.5B</div>
              <div className="hero-stat-label">TVL</div>
            </div>
          </div>
          <div className="subtitle-pill-cluster">
            <a href="#" className="pill" onClick={handleComingSoon}>{t['hero.pill1']}</a>
            <a href="https://macpool.net/" className="pill accent" target="_blank" rel="noopener noreferrer">{t['hero.pill2']}</a>
          </div>
        </div>
        <div className="grunge-map">
          <div className="footer-content">
            <div className="value-panel">
              <div className="value-item">
                <div className="value-mono">01</div>
                <div>
                  <div className="value-number">5 Y</div>
                  <div className="value-title">{t['stats.halving']}</div>
                  <div className="value-desc">{t['stats.halvingDesc']}</div>
                </div>
              </div>
              <div className="value-item">
                <div className="value-mono">02</div>
                <div>
                  <div className="value-number">3.1 B</div>
                  <div className="value-title">{t['stats.supply']}</div>
                  <div className="value-desc">{t['stats.supplyDesc']}</div>
                </div>
              </div>
            </div>
            <div className="coordinate-circle" onClick={() => document.getElementById('page-two').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7"></path>
              </svg>
            </div>
            <div className="value-panel">
              <div className="value-item">
                <div className="value-mono">03</div>
                <div>
                  <div className="value-number">120 D</div>
                  <div className="value-title">{t['stats.unlock']}</div>
                  <div className="value-desc">{t['stats.unlockDesc']}</div>
                </div>
              </div>
              <div className="value-item">
                <div className="value-mono">04</div>
                <div>
                  <div className="value-number">0 Gas</div>
                  <div className="value-title">{t['stats.gas']}</div>
                  <div className="value-desc">{t['stats.gasDesc']}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Comparison */}
      <section className="page-two" id="page-two">
        <div className="page-two-header">
          <h2>{t['p2.title']}</h2>
          <p>{t['p2.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <table className="compare-table">
          <thead>
            <tr>
              <th>{t['p2.col0']}</th>
              <th className="highlight-col">Meta Assets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t['p2.r1c0']}</td>
              <td className="mac-col">{t['p2.r1c1']}</td>
            </tr>
            <tr>
              <td>{t['p2.r2c0']}</td>
              <td className="mac-col">{t['p2.r2c1']}</td>
            </tr>
            <tr>
              <td>{t['p2.r3c0']}</td>
              <td className="mac-col">{t['p2.r3c1']}</td>
            </tr>
            <tr>
              <td>{t['p2.r4c0']}</td>
              <td className="mac-col">{t['p2.r4c1']}</td>
            </tr>
            <tr>
              <td>{t['p2.r5c0']}</td>
              <td className="mac-col">{t['p2.r5c1']}</td>
            </tr>
            <tr>
              <td>{t['p2.r6c0']}</td>
              <td className="mac-col">{t['p2.r6c1']}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Page: How MAC Achieves True Web 4.0 */}
      <section className="page-spirit" id="page-spirit">
        <div className="ps-header">
          <h2>{t['ps.title']}</h2>
          <p>{t['ps.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="ps-grid">
          <Link to="/ai-agent" className="ps-card">
            <div className="ps-card-num">01</div>
            <h3>{t['ps.c1title']}</h3>
            <p>{t['ps.c1desc']}</p>
          </Link>
          <Link to="/pocc-consensus" className="ps-card">
            <div className="ps-card-num">02</div>
            <h3>{t['ps.c2title']}</h3>
            <p>{t['ps.c2desc']}</p>
          </Link>
          <Link to="/virtual-real-integration" className="ps-card">
            <div className="ps-card-num">03</div>
            <h3>{t['ps.c3title']}</h3>
            <p>{t['ps.c3desc']}</p>
          </Link>
          <Link to="/decentralized-collaboration" className="ps-card">
            <div className="ps-card-num">04</div>
            <h3>{t['ps.c4title']}</h3>
            <p>{t['ps.c4desc']}</p>
          </Link>
        </div>
      </section>

      {/* Page: Tech Architecture */}
      <section className="page-arch" id="page-arch">
        <div className="pa-header">
          <h2>{t['pa.title']}</h2>
          <p>{t['pa.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pa-section-label">{t['pa.layerLabel']}</div>
        <div className="pa-layers">
          <div className="pa-layer">
            <div className="pa-layer-num">01</div>
            <h3>{t['pa.l1title']}</h3>
            <p>{t['pa.l1desc']}</p>
          </div>
          <div className="pa-layer">
            <div className="pa-layer-num">02</div>
            <h3>{t['pa.l2title']}</h3>
            <p>{t['pa.l2desc']}</p>
          </div>
          <div className="pa-layer">
            <div className="pa-layer-num">03</div>
            <h3>{t['pa.l3title']}</h3>
            <p>{t['pa.l3desc']}</p>
          </div>
          <div className="pa-layer">
            <div className="pa-layer-num">04</div>
            <h3>{t['pa.l4title']}</h3>
            <p>{t['pa.l4desc']}</p>
          </div>
        </div>
        <div className="pa-section-label">{t['pa.featLabel']}</div>
        <div className="pa-features">
          <div className="pa-feat">
            <h3>{t['pa.f1title']}</h3>
            <p>{t['pa.f1desc']}</p>
          </div>
          <div className="pa-feat">
            <h3>{t['pa.f2title']}</h3>
            <p>{t['pa.f2desc']}</p>
          </div>
          <div className="pa-feat">
            <h3>{t['pa.f3title']}</h3>
            <p>{t['pa.f3desc']}</p>
          </div>
          <div className="pa-feat">
            <h3>{t['pa.f4title']}</h3>
            <p>{t['pa.f4desc']}</p>
          </div>
        </div>
      </section>

      {/* Page 3: ClawMask */}
      <section className="page-three" id="page-three">
        <div className="p3-container">
          <div className="p3-product-col">
            <div className="p3-scene">
              <div className="p3-computer">
                <div className="p3-face p3-front">
                  <div className="p3-screen-inset">
                    <div className="p3-crt">
                      <div className="p3-crt-glow">
                        <div className="p3-cli-header"><span>ClawMask V2.2</span><span>MEM: 512K OK</span></div>
                        <div className="p3-typing"><span style={{ color: '#888' }}>&gt;_</span> {typewriterText}<span className="p3-cursor"></span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p3-grill">
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                  </div>
                  <div className="p3-floppy"></div>
                  <div className="p3-sticker">ClawMask V2.2</div>
                  <div className="p3-logo-badge"></div>
                </div>
                <div className="p3-face p3-back"></div>
                <div className="p3-face p3-left"></div>
                <div className="p3-face p3-right"></div>
                <div className="p3-face p3-top"></div>
                <div className="p3-face p3-bottom"></div>
                <div className="p3-kb">
                  <div className="p3-kb-base">
                    <div className="p3-keys">
                      <div className="p3-key dk"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key dk w15"></div>
                      <div className="p3-key dk w15"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key dk w15"></div>
                      <div className="p3-key dk w2"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key"></div><div className="p3-key dk w2"></div>
                      <div className="p3-key dk"></div><div className="p3-key dk"></div><div className="p3-key dk w15"></div><div className="p3-key sp"></div><div className="p3-key dk w15"></div><div className="p3-key dk"></div><div className="p3-key ac"></div>
                    </div>
                  </div>
                  <div className="p3-kb-front"></div>
                  <div className="p3-kb-back"></div>
                  <div className="p3-kb-left"></div>
                  <div className="p3-kb-right"></div>
                  <div className="p3-kb-shadow"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p3-content-col">
            <div className="p3-badge">{t['p3.badge']}</div>
            <div className="p3-title">{t['p3.title']}</div>
            <p className="p3-lead">{t['p3.lead']}</p>
            <div className="p3-cta-group">
              <a href="https://clawservice.metaassetschain.org/" className="p3-btn" target="_blank" rel="noopener noreferrer">{t['p3.btn']}</a>
              <div className="p3-price"><span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 8 }}>$600</span>{t['p3.free']}</div>
            </div>
            <div className="p3-terminal">
              <div className="p3-term-header">
                <span>ClawMask V2.2</span>
                <div className="p3-term-dots">
                  <div className="p3-term-dot"></div>
                  <div className="p3-term-dot"></div>
                  <div className="p3-term-dot"></div>
                </div>
              </div>
              <div className="p3-term-body">
                <div><span className="p3-label">{t['p3.f1label']}</span> <span className="p3-val">{t['p3.f1val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f2label']}</span> <span className="p3-val">{t['p3.f2val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f3label']}</span> <span className="p3-val">{t['p3.f3val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f4label']}</span> <span className="p3-val">{t['p3.f4val']}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page 4: DApp */}
      <section className="page-four" id="page-four">
        <div className="p4-header">
          <h2>{t['p4.title']}</h2>
          <p>{t['p4.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="p4-container">
          <div className="p4-gallery">
            <div className="p4-gallery-stage">
              {phoneImgs.map((src, i) => {
                const rel = (i - p4idx + 4) % 4;
                const pos = rel === 0 ? 'p4-phone-center' : rel === 1 ? 'p4-phone-right' : rel === 3 ? 'p4-phone-left' : 'p4-phone-far';
                return (
                  <div className={`p4-phone ${pos}`} key={i} data-p4={i}>
                    <div className="p4-phone-frame"><img src={src} alt="" /></div>
                  </div>
                );
              })}
            </div>
            <div className="p4-gallery-controls">
              <button className="p4-gbtn" onClick={() => p4update((p4idx - 1 + 4) % 4)}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="p4-dots">
                {[0, 1, 2, 3].map(i => (
                  <span key={i} className={`p4-dot ${p4idx === i ? 'active' : ''}`} onClick={() => p4update(i)}></span>
                ))}
              </div>
              <button className="p4-gbtn" onClick={() => p4update((p4idx + 1) % 4)}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
          <div className="p4-right">
            <div className="p4-radar-wrap">
              <div className="p4-radar-bg"></div>
              <div className="p4-arc"></div>
              <div className="p4-arc-sharp"></div>
              <div className="p4-ring p4-ring-1"></div>
              <div className="p4-ring p4-ring-2"></div>
              <div className="p4-ring p4-ring-3"></div>
              <div className="p4-scanner"></div>
              <div className={`p4-hud p4-hud-top ${p4idx === 0 ? 'active' : ''}`}>{t['p4.hud0']}</div>
              <div className={`p4-hud p4-hud-right ${p4idx === 1 ? 'active' : ''}`}>{t['p4.hud1']}</div>
              <div className={`p4-hud p4-hud-bottom ${p4idx === 2 ? 'active' : ''}`}>{t['p4.hud2']}</div>
              <div className={`p4-hud p4-hud-left ${p4idx === 3 ? 'active' : ''}`}>{t['p4.hud3']}</div>
              <div className="p4-card">
                <div className="p4-card-title">{t[`p4.slide${p4idx}title`]}</div>
                <div className="p4-card-desc">{t[`p4.slide${p4idx}desc`]}</div>
                <button className="p4-download-btn" onClick={handleComingSoon}>{t['p4.dlbtn']}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page: Partners */}
      <section className="page-partners" id="page-partners">
        <div className="pp-header">
          <h2>{t['pp.title']}</h2>
          <p className="pp-sub">{t['pp.sub']}</p>
          <p className="pp-desc">{t['pp.desc']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pp-carousel">
          <div className="pp-carousel-viewport">
            <div className="pp-carousel-track" style={{ transform: `translateX(${-ppSlide * 100}%)` }}>
                {ppItems.map((p, i) => (
                <div className="pp-carousel-slide" key={i}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="pp-card">
                    <div className="pp-card-icon"><img src={p.icon} alt={p.name} style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
                    <h3>{p.name}</h3>
                    <p>{t[p.descKey]}</p>
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="pp-carousel-controls">
            <button className="pp-gbtn" onClick={() => ppGo(ppSlide - 1)} aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="pp-dots">
              {Array.from({ length: PP_SLIDES }).map((_, i) => (
                <span key={i} className={`pp-dot ${ppSlide === i ? 'active' : ''}`} onClick={() => ppGo(i)}></span>
              ))}
            </div>
            <button className="pp-gbtn" onClick={() => ppGo(ppSlide + 1)} aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
        <div className="pp-wallet-section">
          <h3 className="pp-wallet-title">{t['pp.walletTitle']}</h3>
          <div className="pp-carousel">
            <div className="pp-carousel-viewport">
              <div className="pp-carousel-track" style={{ transform: `translateX(${-wpSlide * 100}%)` }}>
                  {wpItems.map((p, i) => (
                  <div className="pp-carousel-slide" key={i}>
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className="pp-card">
                      <div className="pp-card-icon"><img src={p.icon} alt={p.name} style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
                      <h3>{p.name}</h3>
                      <p>{t[p.descKey]}</p>
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div className="pp-carousel-controls">
              <button className="pp-gbtn" onClick={() => wpGo(wpSlide - 1)} aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="pp-dots">
                {Array.from({ length: WP_SLIDES }).map((_, i) => (
                  <span key={i} className={`pp-dot ${wpSlide === i ? 'active' : ''}`} onClick={() => wpGo(i)}></span>
                ))}
              </div>
              <button className="pp-gbtn" onClick={() => wpGo(wpSlide + 1)} aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="pp-cta">
          <a href="#" className="pp-btn-cta" onClick={handleComingSoon}>{t['pp.cta']}</a>
        </div>
      </section>

      {/* Page: Events */}
      <section className="page-events" id="page-events">
        <div className="pe-header">
          <h2>{t['pe.title']}</h2>
          <p>{t['pe.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pe-grid">
          <div className="pe-card">
            <h3>{t['pe.c1title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c1time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c1users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c1btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c2title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c2time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c2users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c2btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c3title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c3time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c3users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c3btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c4title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c4time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c4users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c4btn']}</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/images/logo.png" alt="META ASSETS" />
                <span>META ASSETS</span>
              </div>
              <p className="footer-desc">{t['footer.desc']}</p>
              <div className="footer-socials">
                <a href="https://x.com/MetaAssets_MA" className="footer-social" aria-label="X" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="https://t.me/metaassets_ma" className="footer-social" aria-label="Telegram" target="_blank" rel="noopener noreferrer"><i className="fab fa-telegram-plane"></i></a>
                <a href="https://discord.com/invite/xmfWWAUphm" className="footer-social" aria-label="Discord" target="_blank" rel="noopener noreferrer"><i className="fab fa-discord"></i></a>
                <a href="https://medium.com/@MetaAssets" className="footer-social" aria-label="Medium" target="_blank" rel="noopener noreferrer"><i className="fab fa-medium"></i></a>
                <a href="https://www.instagram.com/metaassets_ma" className="footer-social" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
                <a href="https://www.youtube.com/@MetaAssets_MA" className="footer-social" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>{t['footer.col1h']}</h4>
                <a href="#whitepaper-technical">{t['footer.col1l1']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l5']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col2h']}</h4>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l1']}</a>
                <a href="https://macpool.net/" target="_blank" rel="noopener noreferrer">{t['footer.col2l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l5']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col3h']}</h4>
                <a href="https://x.com/MetaAssets_MA" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://t.me/metaassets_ma" target="_blank" rel="noopener noreferrer">Telegram</a>
                <a href="https://discord.com/invite/xmfWWAUphm" target="_blank" rel="noopener noreferrer">Discord</a>
                <a href="https://medium.com/@MetaAssets" target="_blank" rel="noopener noreferrer">Medium</a>
                <a href="https://www.youtube.com/@MetaAssets_MA" target="_blank" rel="noopener noreferrer">YouTube</a>
                <a href="https://www.instagram.com/metaassets_ma" target="_blank" rel="noopener noreferrer">Instagram</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col4h']}</h4>
                <a href="#" onClick={handleAbout}>{t['footer.col4l1']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l5']}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t['footer.copy']}</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <div id="coming-soon-modal" className={`coming-soon-modal ${modalActive ? 'active' : ''}`}>
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 16V28M24 34V36" stroke="#00E5C4" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="coming-soon-title">{t['modal.title']}</h3>
        </div>
      </div>

      {/* About Modal */}
      <div className={`about-modal ${aboutActive ? 'active' : ''}`} onClick={() => setAboutActive(false)}>
        <div className="about-modal-content" onClick={e => e.stopPropagation()}>
          <button className="about-modal-close" onClick={() => setAboutActive(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <h2 className="about-modal-title">{t['about.title']}</h2>
          <div className="about-modal-body">
            {t['about.paragraphs'].map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </>
  );
}

export default App;
