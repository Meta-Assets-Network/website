import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/decentralized-collaboration.en.mdx';
import zhMdx from '../docs/decentralized-collaboration.zh.mdx';

const frontmatter = {
  en: {
    title: 'META ASSETS - Decentralized Collaboration',
    heroTitle: 'Decentralized Collaboration',
    heroSub: 'Global Computing Network on MA Chain',
    pdfUrl: '',
    badge: 'Decentralized Collaboration',
  },
  zh: {
    title: 'META ASSETS - 去中心化协作',
    heroTitle: '去中心化协作',
    heroSub: 'MA 链全球算力网络',
    pdfUrl: '',
    badge: '去中心化协作',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx };

function DecentralizedCollaboration() {
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

export default DecentralizedCollaboration;
