import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/ai-agent.en.mdx';
import zhMdx from '../docs/ai-agent.zh.mdx';
import zhTWMdx from '../docs/ai-agent.zh-TW.mdx';
import jaMdx from '../docs/ai-agent.ja.mdx';
import koMdx from '../docs/ai-agent.ko.mdx';

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
  'zh-TW': {
    title: 'META ASSETS - Agent 自主性',
    heroTitle: 'Agent 自主性',
    heroSub: 'MA 鏈 AI Agent',
    pdfUrl: '',
    badge: 'Agent 自主性',
  },
  ja: {
    title: 'META ASSETS - エージェント自律性',
    heroTitle: 'エージェント自律性',
    heroSub: 'MAチェーンのAIエージェント',
    pdfUrl: '',
    badge: 'エージェント自律性',
  },
  ko: {
    title: 'META ASSETS - 에이전트 자율성',
    heroTitle: '에이전트 자율성',
    heroSub: 'MA 체인 AI 에이전트',
    pdfUrl: '',
    badge: '에이전트 자율성',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx, 'zh-TW': zhTWMdx, ja: jaMdx, ko: koMdx };

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
