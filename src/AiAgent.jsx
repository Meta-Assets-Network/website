import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/ai-agent.en.mdx';
import zhMdx from '../docs/ai-agent.zh.mdx';

const frontmatter = {
  en: {
    title: 'META ASSETS - Agent Autonomy',
    heroTitle: 'Agent Autonomy',
    heroSub: 'AI Agent on MA Chain',
    pdfUrl: '',
    badge: 'Agent Autonomy',
  },
  zh: {
    title: 'META ASSETS - Agent 自主性',
    heroTitle: 'Agent 自主性',
    heroSub: 'MA 链 AI Agent',
    pdfUrl: '',
    badge: 'Agent 自主性',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx };

function AiAgent() {
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

export default AiAgent;
