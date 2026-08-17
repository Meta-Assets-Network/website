import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/tokenomics.en.mdx';
import zhMdx from '../docs/tokenomics.zh.mdx';
import zhTWMdx from '../docs/tokenomics.zh-TW.mdx';
import jaMdx from '../docs/tokenomics.ja.mdx';
import koMdx from '../docs/tokenomics.ko.mdx';

const frontmatter = {
  en: {
    title: 'META ASSETS - Tokenomics Bluepaper',
    heroTitle: 'Tokenomics Bluepaper',
    heroSub: 'MA Chain Economic Model',
    pdfUrl: '',
    badge: 'Tokenomics Bluepaper',
  },
  zh: {
    title: 'META ASSETS - 经济蓝皮书',
    heroTitle: '经济蓝皮书',
    heroSub: 'MA 链经济模型',
    pdfUrl: '',
    badge: '经济蓝皮书',
  },
  'zh-TW': {
    title: 'META ASSETS - 經濟藍皮書',
    heroTitle: '經濟藍皮書',
    heroSub: 'MA 鏈經濟模型',
    pdfUrl: '',
    badge: '經濟藍皮書',
  },
  ja: {
    title: 'META ASSETS - トークノミクスブルーペーパー',
    heroTitle: 'トークノミクスブルーペーパー',
    heroSub: 'MAチェーン経済モデル',
    pdfUrl: '',
    badge: 'トークノミクスブルーペーパー',
  },
  ko: {
    title: 'META ASSETS - 토크노믹스 블루페이퍼',
    heroTitle: '토크노믹스 블루페이퍼',
    heroSub: 'MA 체인 경제 모델',
    pdfUrl: '',
    badge: '토크노믹스 블루페이퍼',
  },
};

const mdxMap = { en: enMdx, zh: zhMdx, 'zh-TW': zhTWMdx, ja: jaMdx, ko: koMdx };

function Tokenomics() {
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

export default Tokenomics;
