import { useState, useEffect } from 'react';
import DocPage from './DocPage';
import enMdx from '../docs/whitepaper.en.mdx';
import zhMdx from '../docs/whitepaper.zh.mdx';
import zhTWMdx from '../docs/whitepaper.zh-TW.mdx';
import jaMdx from '../docs/whitepaper.ja.mdx';
import koMdx from '../docs/whitepaper.ko.mdx';

const PDF_URL_ZH = 'https://oss-file.s3.ap-northeast-1.amazonaws.com/POCC%EF%BC%88Proof+of+Computation+Capacity%EF%BC%89%E5%85%B1%E8%AF%86%E3%80%81TSS+%E6%B2%BB%E7%90%86%E4%B8%8E+RWA+%E7%AE%97%E5%8A%9B%E8%B5%84%E4%BA%A7%E5%8C%96%E4%BD%93%E7%B3%BB.pdf';
const PDF_URL_EN = 'https://p6-flow-sign.byteimg.com/tos-cn-i-ik7evvg4ik/ci/38417533459281154/POCC_TSS_RWA_Computing_Power_Assetization_System_EN.pdf~tplv-7xpig5zlmi-image.image?lk3s=8e244e95&x-signature=A%2BkLNfkSj3cEZf3Ueyv4nz9iNAE%3D&rrcfp=2f5a035e&title=POCC_TSS_RWA_Computing_Power_Assetization_System_EN.pdf&rcl=2026032415130296BD16F1FB6A5309F705&x-expires=1774941636&attname=POCC_TSS_RWA_Computing_Power_Assetization_System_EN.pdf&push_animated=1&show_loading=0&webview_progress_bar=1&theme=light';

const frontmatter = {
  en: {
    title: 'META ASSETS - Technical Whitepaper',
    heroTitle: 'POCC (Proof of Computation Capacity) Consensus, TSS Governance & RWA Computing Asset Tokenization System',
    heroSub: 'MA Chain (MetaAssets) Technical Architecture',
    pdfUrl: PDF_URL_EN,
  },
  zh: {
    title: 'META ASSETS - 技术白皮书',
    heroTitle: 'POCC（Proof of Computation Capacity）共识、TSS 治理与 RWA 算力资产化体系',
    heroSub: 'MA 链（MetaAssets）技术架构',
    pdfUrl: PDF_URL_ZH,
  },
  'zh-TW': {
    title: 'META ASSETS - 技術白皮書',
    heroTitle: 'POCC（Proof of Computation Capacity）共識、TSS 治理與 RWA 算力資產化體系',
    heroSub: 'MA 鏈（MetaAssets）技術架構',
    pdfUrl: PDF_URL_ZH,
  },
  ja: {
    title: 'META ASSETS - 技術ホワイトペーパー',
    heroTitle: 'POCC（Proof of Computation Capacity）コンセンサス、TSSガバナンスとRWAコンピューティング資産化体系',
    heroSub: 'MAチェーン（MetaAssets）技術アーキテクチャ',
    pdfUrl: PDF_URL_EN,
  },
  ko: {
    title: 'META ASSETS - 기술 백서',
    heroTitle: 'POCC(Proof of Computation Capacity) 컨센서스, TSS 거버넌스와 RWA 컴퓨팅 자산화 체계',
    heroSub: 'MA 체인(MetaAssets) 기술 아키텍처',
    pdfUrl: PDF_URL_EN,
  },
};

const mdxComponents = {
  en: enMdx,
  zh: zhMdx,
  'zh-TW': zhTWMdx,
  ja: jaMdx,
  ko: koMdx,
};

function WhitepaperTechnical() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const MdxContent = mdxComponents[lang];
  if (!MdxContent) return null;

  return (
    <DocPage frontmatter={frontmatter[lang]}>
      <MdxContent />
    </DocPage>
  );
}

export default WhitepaperTechnical;
