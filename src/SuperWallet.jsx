import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { translations } from './translations';
import './SuperWallet.css';

// APK 直接放仓库 public/downloads/，构建后从官网下载；App Store 链接待上架后替换
const APK_URL = '/downloads/metaassets-wallet.apk';
const APPSTORE_URL = '#';
const TESTFLIGHT_URL = 'https://testflight.apple.com/join/hhb4ys9d';

const DAPP_CHIPS = ['MA Swap', 'MA Bridge', 'DAO Governance', 'DeFi', 'NFT', 'Community Apps'];

function SuperWallet() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [tfModal, setTfModal] = useState(false);
  const [tfCopied, setTfCopied] = useState(false);

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.en;
  const isZh = lang === 'zh' || lang === 'zh-TW';

  const handleTestFlight = (e) => {
    e.preventDefault();
    setTfCopied(false);
    setTfModal(true);
  };

  const copyTfLink = async () => {
    try {
      await navigator.clipboard.writeText(TESTFLIGHT_URL);
    } catch {
      // ponytail: http 环境兜底，https 下不会走到
      const ta = document.createElement('textarea');
      ta.value = TESTFLIGHT_URL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setTfCopied(true);
  };

  useEffect(() => {
    document.title = t['sw.title'];
  }, [t]);

  return (
    <div className={`sw-page ${isZh ? 'lang-zh' : ''}`}>
      {/* Nav */}
      <nav className="sw-nav">
        <Link to="/" className="sw-nav-left">
          <img src="/images/logo.png" alt="META ASSETS" />
          <span>META ASSETS</span>
        </Link>
        <Link to="/" className="sw-nav-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {t['sw.back']}
        </Link>
      </nav>

      {/* 01 Hero */}
      <section className="sw-section sw-hero">
        <span className="sw-tag">01 · HERO / DOWNLOAD</span>
        <div className="sw-hero-inner">
          <div className="sw-hero-copy">
            <span className="sw-eyebrow">{t['sw.hero.tag']}</span>
            <h1 className="sw-h">{t['sw.hero.h']}</h1>
            <p className="sw-p">{t['sw.hero.p']}</p>
            <div className="sw-btns">
              <a href={APK_URL} download className="sw-btn sw-btn-primary">{t['sw.apk']}</a>
              <a href={APPSTORE_URL} className="sw-btn sw-btn-ghost">{t['sw.appstore']}</a>
              <a href={TESTFLIGHT_URL} onClick={handleTestFlight} className="sw-btn sw-btn-ghost">{t['sw.testflight']}</a>
            </div>
            <div className="sw-hero-feats">
              <span>{t['sw.hero.f1']}</span>
              <span>{t['sw.hero.f2']}</span>
              <span>{t['sw.hero.f3']}</span>
            </div>
          </div>
          <img className="sw-hero-img" src="/images/superwallet-wallet.png" alt="Super Wallet" />
        </div>
      </section>

      {/* 02 Product Overview */}
      <section className="sw-section sw-s2">
        <span className="sw-tag">02 · PRODUCT OVERVIEW</span>
        <div className="sw-s2-head">
          <h2 className="sw-h">{t['sw.s2.h']}</h2>
        </div>
        <div className="sw-cards">
          {[
            { n: '01', title: t['sw.s2.c1t'], desc: t['sw.s2.c1d'] },
            { n: '02', title: t['sw.s2.c2t'], desc: t['sw.s2.c2d'] },
            { n: '03', title: t['sw.s2.c3t'], desc: t['sw.s2.c3d'] },
            { n: '04', title: t['sw.s2.c4t'], desc: t['sw.s2.c4d'] },
          ].map(c => (
            <div className="sw-card" key={c.n}>
              <div className="sw-card-num">{c.n}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 Social + Identity */}
      <section className="sw-section sw-s3">
        <span className="sw-tag">03 · SOCIAL + IDENTITY</span>
        <div className="sw-s3-inner">
          <div className="sw-s3-copy">
            <span className="sw-eyebrow">{t['sw.s3.tag']}</span>
            <h2 className="sw-h">{t['sw.s3.h']}</h2>
            <p className="sw-p">{t['sw.s3.p']}</p>
            <div className="sw-s3-feats">
              <div className="sw-s3-feat">
                <h4>{t['sw.s3.f1t']}</h4>
                <p>{t['sw.s3.f1d']}</p>
              </div>
              <div className="sw-s3-feat">
                <h4>{t['sw.s3.f2t']}</h4>
                <p>{t['sw.s3.f2d']}</p>
              </div>
            </div>
          </div>
          <div className="sw-s3-imgs">
            <img className="sw-s3-img-main" src="/images/superwallet-messages.png" alt="Messages" />
            <img className="sw-s3-img-sub" src="/images/superwallet-profile.png" alt="Profile" />
          </div>
        </div>
      </section>

      {/* 04 Discover + DApp + DAO */}
      <section className="sw-section sw-s4">
        <span className="sw-tag">04 · DISCOVER + DAPP + DAO</span>
        <div className="sw-s4-inner">
          <div className="sw-s4-copy">
            <span className="sw-eyebrow">{t['sw.s4.tag']}</span>
            <h2 className="sw-h">{t['sw.s4.h']}</h2>
            <p className="sw-p">{t['sw.s4.p']}</p>
            <div className="sw-chips">
              {DAPP_CHIPS.map(c => <span className="sw-chip" key={c}>{c}</span>)}
            </div>
          </div>
          <img className="sw-s4-img" src="/images/superwallet-discover.png" alt="Discover" />
        </div>
      </section>

      {/* 05 Download */}
      <section className="sw-section sw-s5">
        <span className="sw-tag">05 · DOWNLOAD CENTER</span>
        <h2 className="sw-h">{t['sw.s5.h']}</h2>
        <div className="sw-platforms">
          <div className="sw-platform">
            <span className="sw-platform-tag">{t['sw.s5.android']}</span>
            <h3>{t['sw.s5.androidH']}</h3>
            <p>{t['sw.s5.androidP']}</p>
            <a href={APK_URL} download className="sw-btn sw-btn-primary">{t['sw.apk']}</a>
          </div>
          <div className="sw-platform">
            <span className="sw-platform-tag">{t['sw.s5.ios']}</span>
            <h3>{t['sw.s5.iosH']}</h3>
            <p>{t['sw.s5.iosP']}</p>
            <a href={APPSTORE_URL} className="sw-btn sw-btn-ghost">{t['sw.s5.iosBtn']}</a>
          </div>
        </div>
      </section>

      {/* 06 保障 */}
      <section className="sw-s6">
        <div className="sw-s6-item">
          <h4>{t['sw.s6.f1t']}</h4>
          <p>{t['sw.s6.f1d']}</p>
        </div>
        <div className="sw-s6-item">
          <h4>{t['sw.s6.f2t']}</h4>
          <p>{t['sw.s6.f2d']}</p>
        </div>
      </section>

      {/* TestFlight Modal */}
      {tfModal && (
        <div className="sw-modal" onClick={() => setTfModal(false)}>
          <div className="sw-modal-content" onClick={e => e.stopPropagation()}>
            <button className="sw-modal-close" onClick={() => setTfModal(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <h3>{t['sw.testflight']}</h3>
            <p className="sw-modal-tip">{t['sw.tf.tip']}</p>
            <div className="sw-modal-link-row">
              <code>{TESTFLIGHT_URL}</code>
              <button className="sw-btn sw-btn-primary sw-copy-btn" onClick={copyTfLink}>
                {tfCopied ? t['sw.tf.copied'] : t['sw.tf.copy']}
              </button>
            </div>
            <p className="sw-modal-alt">
              {t['sw.tf.open']}{' '}
              <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer">{t['sw.tf.here']}</a>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="sw-footer">
        <div className="sw-footer-logo">
          <img src="/images/logo.png" alt="META ASSETS" />
          <span>META ASSETS</span>
        </div>
        <div className="sw-footer-links">
          <Link to="/privacy">{t['footer.privacy']}</Link>
          <Link to="/terms">{t['footer.terms']}</Link>
        </div>
      </footer>
    </div>
  );
}

export default SuperWallet;
