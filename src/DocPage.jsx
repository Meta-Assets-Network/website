import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from './mdx-components';
import { translations } from './translations';
import './DocPage.css';

function extractToc(container) {
  if (!container) return [];
  const headings = container.querySelectorAll('h2, h3');
  const items = [];
  headings.forEach(h => {
    if (h.id) {
      items.push({ id: h.id, text: h.textContent, sub: h.tagName === 'H3' });
    }
  });
  return items;
}

export default function DocPage({ children, frontmatter = {} }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [activeSection, setActiveSection] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [tocItems, setTocItems] = useState([]);
  const contentRef = useRef(null);

  const t = translations[lang];
  const pdfUrl = frontmatter.pdfUrl || '';

  useEffect(() => {
    document.title = frontmatter.title || t['wp.title'];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.body.classList.toggle('lang-zh', lang === 'zh');
    window.scrollTo(0, 0);
    return () => { document.body.classList.remove('lang-zh'); };
  }, [lang, frontmatter.title, t]);

  // Extract TOC after MDX content is mounted to DOM
  const updateToc = useCallback(() => {
    setTocItems(extractToc(contentRef.current));
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is painted
    const raf = requestAnimationFrame(() => {
      updateToc();
    });
    return () => cancelAnimationFrame(raf);
  }, [children, lang, updateToc]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 400);
      const sections = contentRef.current?.querySelectorAll('[id]');
      let currentId = '';
      if (sections) {
        sections.forEach(sec => {
          if (sec.getBoundingClientRect().top <= 120) currentId = sec.id;
        });
      }
      setActiveSection(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new CustomEvent('langchange', { detail: newLang }));
  };

  const handleTocClick = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };

  return (
    <div className={`wp-page ${lang === 'zh' ? 'lang-zh' : ''}`}>
      {/* Top Nav */}
      <nav className="wp-top-nav">
        <div className="wp-top-nav-left">
          <Link to="/" className="wp-top-nav-logo">
            <img src="/images/logo.png" alt="META ASSETS" />
            <span>META ASSETS</span>
          </Link>
          <Link to="/" className="wp-top-nav-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{t['wp.back_home']}</span>
          </Link>
        </div>
        <div className="wp-top-nav-right">
          <button className="wp-lang-switch" onClick={toggleLang}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <a href={pdfUrl || '#'} download={pdfUrl || undefined} className={`wp-download-btn${!pdfUrl ? ' disabled' : ''}`} onClick={!pdfUrl ? e => e.preventDefault() : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="wp-dl-text">{t['wp.download']}</span>
          </a>
        </div>
      </nav>

      <div className="wp-wrapper">
        {/* Sidebar TOC */}
        <aside className={`wp-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="wp-toc-title">{t['wp.toc']}</div>
          {tocItems.map(item => (
            <a
              key={item.id}
              className={`wp-toc-link ${item.sub ? 'sub' : ''} ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleTocClick(item.id)}
            >
              {item.text}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main className="wp-main" ref={contentRef}>
          {/* Hero */}
          <div className="wp-hero">
            <div className="wp-hero-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
              <span>{frontmatter.badge || t['wp.badge']}</span>
            </div>
            <h1 className="wp-hero-title">{frontmatter.heroTitle}</h1>
            <div className="wp-hero-sub">{frontmatter.heroSub}</div>
            <div className="wp-hero-meta">
              <span>META ASSETS Foundation</span>
              <span>v1.0</span>
              <span>2025</span>
            </div>
          </div>

          {/* MDX Content */}
          <div className="wp-mdx-content">
            <MDXProvider components={mdxComponents}>
              {children}
            </MDXProvider>
          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="wp-footer-bar">
        <p>{t['wp.footer']}</p>
      </div>

      {/* Back to top */}
      <button
        className={`wp-back-top ${showBackTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* Sidebar toggle (mobile) */}
      <button
        className="wp-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle table of contents"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
    </div>
  );
}
