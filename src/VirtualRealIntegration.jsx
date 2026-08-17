import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/virtual-real-integration.en.mdx';
import zhMdx from '../docs/virtual-real-integration.zh.mdx';
import zhTWMdx from '../docs/virtual-real-integration.zh-TW.mdx';

const frontmatter = {
  en: {
    title: 'META ASSETS - Virtual-Real Fusion',
    heroTitle: 'Virtual-Real Fusion',
    heroSub: 'Cross-Chain + RWA on MA Chain',
    pdfUrl: '',
    badge: 'Virtual-Real Fusion',
  },
  zh: {
    title: 'META ASSETS - 虚实融合',
    heroTitle: '虚实融合',
    heroSub: 'MA 链跨链中继 + RWA 上链',
    pdfUrl: '',
    badge: '虚实融合',
  },
  'zh-TW': {
    title: 'META ASSETS - 虛實融合',
    heroTitle: '虛實融合',
    heroSub: 'MA 鏈跨鏈中繼 + RWA 上鏈',
    pdfUrl: '',
    badge: '虛實融合',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx, 'zh-TW': zhTWMdx };

function VirtualRealIntegration() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const MdxContent = mdxMap[lang];
  if (!MdxContent) return null;

  return (
    <DocPage frontmatter={frontmatter[lang]}>
      <MdxContent />
    </DocPage>
  );
}

export default VirtualRealIntegration;
