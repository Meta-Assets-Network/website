import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/privacy.en.mdx';
import zhMdx from '../docs/privacy.zh.mdx';

const frontmatter = {
  en: {
    title: 'MetaAssets - Privacy Policy',
    badge: 'Privacy Policy',
    heroTitle: 'MetaAssets Privacy Policy',
    heroSub: 'How we collect, use, and protect your personal information',
    metaOrg: 'MA CHAIN GROUP LIMITED',
    metaDate: '2026',
  },
  zh: {
    title: 'MetaAssets - 隐私政策',
    badge: '隐私政策',
    heroTitle: 'MetaAssets 隐私政策',
    heroSub: '我们如何收集、使用和保护您的个人信息',
    metaOrg: 'MA CHAIN GROUP LIMITED',
    metaDate: '2026',
  },
};

// ponytail: en 版兜底其余语言（zh-TW/ja/ko 无独立隐私政策，App 审核只需中英两份）
const mdxComponents = {
  en: enMdx,
  zh: zhMdx,
  'zh-TW': zhMdx,
  ja: enMdx,
  ko: enMdx,
};

// 中文系语言用 zh frontmatter，其余兜底 en
const fmFor = (lang) => (lang === 'zh' || lang === 'zh-TW' ? frontmatter.zh : frontmatter.en);

function PrivacyPolicy() {
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

export default PrivacyPolicy;
