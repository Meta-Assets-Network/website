import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/terms.en.mdx';
import zhMdx from '../docs/terms.zh.mdx';

const frontmatter = {
  en: {
    title: 'MetaAssets - Terms of Service',
    badge: 'Terms of Service',
    heroTitle: 'MetaAssets Terms of Service',
    heroSub: 'The agreement between you and MetaAssets',
    metaOrg: 'MA CHAIN GROUP LIMITED',
    metaDate: '2026',
  },
  zh: {
    title: 'MetaAssets - 服务条款',
    badge: '服务条款',
    heroTitle: 'MetaAssets 服务条款',
    heroSub: '您与 MetaAssets 之间的使用协议',
    metaOrg: 'MA CHAIN GROUP LIMITED',
    metaDate: '2026',
  },
};

// ponytail: en 版兜底其余语言（zh-TW/ja/ko 无独立服务条款，App 审核只需中英两份）
const mdxComponents = {
  en: enMdx,
  zh: zhMdx,
  'zh-TW': zhMdx,
  ja: enMdx,
  ko: enMdx,
};

const fmFor = (lang) => (lang === 'zh' || lang === 'zh-TW' ? frontmatter.zh : frontmatter.en);

function TermsOfService() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const MdxContent = mdxComponents[lang] || enMdx;

  return (
    <DocPage frontmatter={fmFor(lang)}>
      <MdxContent />
    </DocPage>
  );
}

export default TermsOfService;
