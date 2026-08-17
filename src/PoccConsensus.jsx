import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/pocc-consensus.en.mdx';
import zhMdx from '../docs/pocc-consensus.zh.mdx';
import zhTWMdx from '../docs/pocc-consensus.zh-TW.mdx';

const frontmatter = {
  en: {
    title: 'META ASSETS - Verifiable Value',
    heroTitle: 'Verifiable Value',
    heroSub: 'POCC Consensus on MA Chain',
    pdfUrl: '',
    badge: 'Verifiable Value',
  },
  zh: {
    title: 'META ASSETS - 可验证价值',
    heroTitle: '可验证价值',
    heroSub: 'MA 链 POCC 共识机制',
    pdfUrl: '',
    badge: '可验证价值',
  },
  'zh-TW': {
    title: 'META ASSETS - 可驗證價值',
    heroTitle: '可驗證價值',
    heroSub: 'MA 鏈 POCC 共識機制',
    pdfUrl: '',
    badge: '可驗證價值',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx, 'zh-TW': zhTWMdx };

function PoccConsensus() {
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

export default PoccConsensus;
