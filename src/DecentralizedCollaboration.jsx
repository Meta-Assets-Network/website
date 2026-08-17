import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/decentralized-collaboration.en.mdx';
import zhMdx from '../docs/decentralized-collaboration.zh.mdx';
import zhTWMdx from '../docs/decentralized-collaboration.zh-TW.mdx';
import jaMdx from '../docs/decentralized-collaboration.ja.mdx';
import koMdx from '../docs/decentralized-collaboration.ko.mdx';

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
  'zh-TW': {
    title: 'META ASSETS - 去中心化協作',
    heroTitle: '去中心化協作',
    heroSub: 'MA 鏈全球算力網路',
    pdfUrl: '',
    badge: '去中心化協作',
  },
  ja: {
    title: 'META ASSETS - 分散型コラボレーション',
    heroTitle: '分散型コラボレーション',
    heroSub: 'MAチェーンのグローバルコンピューティングネットワーク',
    pdfUrl: '',
    badge: '分散型コラボレーション',
  },
  ko: {
    title: 'META ASSETS - 탈중앙화 협업',
    heroTitle: '탈중앙화 협업',
    heroSub: 'MA 체인 글로벌 컴퓨팅 네트워크',
    pdfUrl: '',
    badge: '탈중앙화 협업',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx, 'zh-TW': zhTWMdx, ja: jaMdx, ko: koMdx };

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
