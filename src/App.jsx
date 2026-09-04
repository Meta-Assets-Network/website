import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { translations } from './translations';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SupportChatWidget from './components/SupportChatWidget';

const LANGUAGES = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'zh', short: '简', label: '简体中文' },
  { code: 'zh-TW', short: '繁', label: '繁體中文' },
  { code: 'ja', short: '日', label: '日本語' },
  { code: 'ko', short: '한', label: '한국어' },
];

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [aboutActive, setAboutActive] = useState(false);
  const [contactActive, setContactActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [p4idx, setP4idx] = useState(0);
  const [ppSlide, setPpSlide] = useState(0);
  const [ppAutoPaused, setPpAutoPaused] = useState(false);
  const ppResumeTimer = useRef(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typewriterRef = useRef(null);

  const t = translations[lang];

  // 把语言反映到 <body>，让 CSS 里 per-language 的字体规则（body.lang-zh …）真正生效。
  // 修复一个历史 bug：此前该 class 从未被设置，导致设计师指定的中文字体（MaShanZheng / Noto Serif SC / Noto Sans SC）从未启用。
  useEffect(() => {
    document.body.classList.toggle('lang-zh', lang === 'zh' || lang === 'zh-TW');
    document.body.classList.toggle('lang-en', lang === 'en');
  }, [lang]);


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

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    setOpenDropdown(null);
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

  // 生态节点 Roadmap：5 个节点（桌面横向等分，上下交替；移动端纵向）
  const roadmap = ['rm.n1title', 'rm.n2title', 'rm.n3title', 'rm.n4title', 'rm.n5title'];

  // DeCloud 收敛拓扑：多个 AI/算力端点 → 中心网关 → 单一 API（SVG viewBox 400×400，中心 200,200）
  const dcEndpoints = [
    { x: 70, y: 75, label: 'LLM' },
    { x: 52, y: 165, label: 'Voice' },
    { x: 40, y: 255, label: 'GPU' },
    { x: 75, y: 340, label: 'NPU' },
    { x: 205, y: 365, label: 'Vision' },
    { x: 330, y: 335, label: 'Edge' },
  ];

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
      <SupportChatWidget />
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
              <a href="https://faucet.machaintest.com/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.faucet']}</a>
              <a href="https://ma-chain.xyz/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.block_explorer']}</a>
            </div>
          </div>
          {/* 门户 / Portal */}
          <div className={`nav-dropdown ${openDropdown === 'portal' ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('portal'); } }}>
              {t['nav.portal']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <Link to="/wallet" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.super_wallet']}</Link>
              <a href="https://macswap.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.macswap']}</a>
              <a href="https://macbridge.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.macbridge']}</a>
              <a href="https://clawservice.metaassetschain.org/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.clawmask_portal']}</a>
            </div>
          </div>
          {/* DeCloud */}
          <a href="https://macdecloud.com/" className="top-nav-link top-nav-link-accent" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.decloud']}</a>
          {/* 质押 / Meta Pool（暂时隐藏）
          <div className={`nav-dropdown ${openDropdown === 'metapool' ? 'open' : ''}`}>
            <a href="https://macpool.net/" className="top-nav-link nav-dropdown-trigger top-nav-link-accent" target="_blank" rel="noopener noreferrer" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('metapool'); } }}>
              {t['nav.metapool']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="https://macpool.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.staking']}</a>
              <a href="https://macpool.net/" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.compute_provider']}</a>
            </div>
          </div>
          */}
          {/* 文档 / Docs */}
          <div className={`nav-dropdown ${openDropdown === 'docs' ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('docs'); } }}>
              {t['nav.docs']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="https://metaassets-1.gitbook.io/metaassets-docs" className="nav-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{t['nav.whitepaper']}</a>
              <Link to="/whitepaper-technical" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.wp_technical']}</Link>
              <Link to="/tokenomics" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.wp_tokenomics']}</Link>
              {/* 开发者文档 / API & SDK / FAQ / Media Kit（暂时隐藏）
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.dev_docs']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.api_sdk']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.faq']}</a>
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.media_kit']}</a>
              */}
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
            <a href="#page-activity" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); toggleDropdown('community'); } }}>
              {t['nav.community']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <a href="#page-activity" className="nav-dropdown-item" onClick={closeMenus}>{t['nav.events']}</a>
              {/* 大使计划（暂时隐藏）
              <a href="#" className="nav-dropdown-item" onClick={(e) => { closeMenus(); handleComingSoon(e); }}>{t['nav.ambassador']}</a>
              */}
            </div>
          </div>
          <div className={`nav-dropdown lang-dropdown lang-switch-mobile ${openDropdown === 'lang' ? 'open' : ''}`}>
            <button className="lang-drop-trigger" onClick={() => toggleDropdown('lang')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              {LANGUAGES.find(l => l.code === lang)?.short}
              <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div className="nav-dropdown-menu lang-drop-menu">
              {LANGUAGES.map(l => (
                <button key={l.code} className={`nav-dropdown-item lang-drop-item ${lang === l.code ? 'active' : ''}`} onClick={() => setLanguage(l.code)}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className={`nav-dropdown lang-dropdown lang-switch-desktop ${openDropdown === 'lang' ? 'open' : ''}`}>
          <button className="lang-drop-trigger" onClick={() => toggleDropdown('lang')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            {LANGUAGES.find(l => l.code === lang)?.short}
            <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className="nav-dropdown-menu lang-drop-menu">
            {LANGUAGES.map(l => (
              <button key={l.code} className={`nav-dropdown-item lang-drop-item ${lang === l.code ? 'active' : ''}`} onClick={() => setLanguage(l.code)}>{l.label}</button>
            ))}
          </div>
        </div>
        <div className="top-nav-wallet">
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
              if (!mounted || !account || !chain) {
                return (
                  <button className="wallet-btn" onClick={openConnectModal} aria-disabled={!mounted} type="button">
                    {t['nav.wallet']}
                  </button>
                );
              }
              const wrongChain = chain.unsupported;
              return (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="wallet-btn" onClick={openChainModal} type="button"
                    style={wrongChain ? { borderColor: '#ff6464', color: '#ff6464' } : undefined}>
                    {wrongChain ? 'Wrong network' : chain.name}
                  </button>
                  <button className="wallet-btn" onClick={openAccountModal} type="button">
                    {account.displayName}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
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
            <Link to="/wallet" className="pill">{t['hero.pill1']}</Link>
            <a href="https://macdecloud.com/" className="pill accent" target="_blank" rel="noopener noreferrer">{t['hero.pill2']}</a>
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

      {/* DeCloud Banner：纯 CSS 轨道视觉 + 产品化左栏 */}
      <section className="page-decloud" id="page-decloud">
        <div className="dc-inner">
          <div className="dc-copy">
            <div className="dc-eyebrow">{t['dc.eyebrow']}</div>
            <h2 className="dc-title">
              {t['dc.title'].split('\n').map((line, i) => (
                <span key={i} className={i === 0 ? 'dc-title-accent' : 'dc-title-base'}>{line}<br /></span>
              ))}
            </h2>
            <div className="dc-features">
              {[1, 2, 3, 4].map(n => (
                <div className="dc-chip" key={n}><span className="dc-chip-dot" />{t[`dc.f${n}`]}</div>
              ))}
            </div>
            <a href="https://macdecloud.com/" className="dc-cta" target="_blank" rel="noopener noreferrer">
              {t['dc.cta']} <span className="dc-cta-arrow">→</span>
            </a>
          </div>
          <div className="dc-mesh" aria-hidden="true">
            <svg className="dc-links" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="dc-link-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(0,229,196,0.55)" />
                  <stop offset="100%" stopColor="rgba(0,229,196,0.05)" />
                </linearGradient>
              </defs>
              {dcEndpoints.map((e, i) => (
                <line key={i} x1={e.x} y1={e.y} x2="200" y2="200" stroke="url(#dc-link-grad)" strokeWidth="1" className="dc-flow" />
              ))}
              <line x1="200" y1="200" x2="372" y2="200" stroke="rgba(0,229,196,0.85)" strokeWidth="1.5" className="dc-flow" />
            </svg>
            {dcEndpoints.map((e, i) => (
              <div className={`dc-endpoint ${e.x > 200 ? 'right' : ''}`} key={i} style={{ left: `${e.x / 4}%`, top: `${e.y / 4}%` }}>
                <span className="dc-e-dot" /><span className="dc-e-label">{e.label}</span>
              </div>
            ))}
            <div className="dc-gateway"><span className="dc-glyph">{'</>'}</span></div>
            <div className="dc-output">API</div>
          </div>
        </div>
      </section>

      {/* 生态节点 Roadmap：横向发光轨道 + 交替节点卡片（移动端转纵向） */}
      <section className="page-roadmap" id="page-roadmap">
        <div className="rm-header">
          <h2>{t['rm.title']}</h2>
          <p>{t['rm.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="rm-track">
          <div className="rm-line" aria-hidden="true" />
          {roadmap.map((titleKey, i) => (
            <div className={`rm-col ${i % 2 === 0 ? 'rm-up' : 'rm-down'}`} key={i}>
              <div className="rm-dot">{String(i + 1).padStart(2, '0')}</div>
              <div className="rm-stem" />
              <div className="rm-card">
                <div className="rm-nlabel">{t[titleKey]}</div>
                <div className="rm-ndate">{t['rm.year']}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

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

      {/* Page: Events — HIDDEN，已被「最新活动」(page-activity) 取代。恢复：去掉下方 {false && ( ... )} 包裹 */}
      {false && (
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
      )}

      {/* Page: Latest Activity（最新活动 — DeCloud 开发者邀请） */}
      <section className="page-activity" id="page-activity">
        <div className="la-inner">
          <div className="la-copy">
            <div className="la-eyebrow">{t['la.eyebrow']}</div>
            <h2 className="la-title">{t['la.title']}</h2>
            <p className="la-subtitle">{t['la.subtitle']}</p>
            <a href="https://macdecloud.com/" className="la-cta" target="_blank" rel="noopener noreferrer">
              {t['la.cta']} <span className="la-cta-arrow">→</span>
            </a>
          </div>
          <div className="la-flow">
            <div className="la-line" aria-hidden="true" />
            <div className="la-step">
              <div className="la-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              </div>
              <div className="la-step-num">01</div>
              <div className="la-step-label">{t['la.s1']}</div>
            </div>
            <div className="la-step">
              <div className="la-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <div className="la-step-num">02</div>
              <div className="la-step-label">{t['la.s2']}</div>
            </div>
            <div className="la-step">
              <div className="la-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="la-step-num">03</div>
              <div className="la-step-label">{t['la.s3']}</div>
            </div>
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
                <a href="https://metaassets-1.gitbook.io/metaassets-docs" target="_blank" rel="noopener noreferrer">{t['footer.col1l1']}</a>
                <Link to="/whitepaper-technical" onClick={closeMenus}>{t['footer.col1l2']}</Link>
                <Link to="/tokenomics" onClick={closeMenus}>{t['footer.col1l3']}</Link>
                <a href="https://faucet.machaintest.com/" target="_blank" rel="noopener noreferrer">{t['footer.col1l4']}</a>
                <a href="https://ma-chain.xyz/" target="_blank" rel="noopener noreferrer">{t['footer.col1l5']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col2h']}</h4>
                <Link to="/wallet" onClick={closeMenus}>{t['footer.col2l1']}</Link>
                <a href="https://macswap.net/" target="_blank" rel="noopener noreferrer">{t['footer.col2l2']}</a>
                <a href="https://macbridge.net/" target="_blank" rel="noopener noreferrer">{t['footer.col2l3']}</a>
                <a href="https://clawservice.metaassetschain.org/" target="_blank" rel="noopener noreferrer">{t['footer.col2l4']}</a>
                <a href="https://macdecloud.com/" target="_blank" rel="noopener noreferrer">{t['footer.col2l5']}</a>
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
                <a href="mailto:mac@macyuanlian.com" onClick={(e) => { e.preventDefault(); setContactActive(true); }}>{t['footer.col4l2']}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t['footer.copy']}</p>
            <div className="footer-legal">
              <Link to="/privacy" onClick={closeMenus}>{t['footer.privacy']}</Link>
              <Link to="/terms" onClick={closeMenus}>{t['footer.terms']}</Link>
            </div>
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

      {/* Contact Modal */}
      <div className={`about-modal ${contactActive ? 'active' : ''}`} onClick={() => setContactActive(false)}>
        <div className="about-modal-content" onClick={e => e.stopPropagation()}>
          <button className="about-modal-close" onClick={() => setContactActive(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <h2 className="about-modal-title">{t['contact.title']}</h2>
          <div className="about-modal-body">
            <p style={{ textAlign: 'center' }}>
              <a href="mailto:mac@macyuanlian.com" style={{ color: '#00E5C4', textDecoration: 'none', fontSize: '1.05em', fontFamily: 'var(--en-mono)', wordBreak: 'break-all' }}>mac@macyuanlian.com</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
