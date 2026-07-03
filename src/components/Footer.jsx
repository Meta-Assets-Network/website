import './Footer.css';

/**
 * 可复用的 Footer 组件
 * @param {Object} props
 * @param {string} props.logoSrc - Logo 图片路径，默认 "/images/logo.png"
 * @param {string} props.brandName - 品牌名称，默认 "META ASSETS"
 * @param {string} props.description - 品牌描述
 * @param {Array<{icon: 'x'|'telegram'|'discord'|'medium'|'instagram'|'youtube', href: string}>} props.socials - 社交链接
 * @param {Array<{title: string, links: Array<{label: string, href: string}>}>} props.columns - 链接列
 * @param {string} props.copyright - 版权文字
 * @param {string} props.lang - 语言，'en' | 'zh'
 */
function Footer({
  logoSrc = '/images/logo.png',
  brandName = 'META ASSETS',
  description = 'Web 4.0 AI-powered infrastructure for the meta-economy.',
  socials = [
    { icon: 'x', href: 'https://x.com/MetaAssets_MA' },
    { icon: 'telegram', href: 'https://t.me/metaassets_ma' },
    { icon: 'discord', href: 'https://discord.com/invite/xmfWWAUphm' },
    { icon: 'medium', href: 'https://medium.com/@MetaAssets' },
    { icon: 'instagram', href: 'https://www.instagram.com/metaassets_ma' },
    { icon: 'youtube', href: 'https://www.youtube.com/@MetaAssets_MA' },
  ],
  columns = [],
  copyright = '© 2025 META ASSETS. All rights reserved.',
}) {
  const socialIcons = {
    x: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    telegram: <i className="fab fa-telegram-plane"></i>,
    discord: <i className="fab fa-discord"></i>,
    medium: <i className="fab fa-medium"></i>,
    instagram: <i className="fab fa-instagram"></i>,
    youtube: <i className="fab fa-youtube"></i>,
  };

  // 默认四列链接（如果未传入）
  const defaultColumns = [
    {
      title: 'Product',
      links: [
        { label: 'Whitepaper', href: '#' },
        { label: 'Explorer', href: '#' },
        { label: 'Mining Pool', href: 'https://macpool.net/' },
        { label: 'ClawMask', href: '#' },
        { label: 'Tokenomics', href: '#' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'GitHub', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'SDK', href: '#' },
        { label: 'Status', href: '#' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Twitter', href: 'https://x.com/MetaAssets_MA' },
        { label: 'Telegram', href: 'https://t.me/metaassets_ma' },
        { label: 'Discord', href: 'https://discord.com/invite/xmfWWAUphm' },
        { label: 'Medium', href: 'https://medium.com/@MetaAssets' },
        { label: 'YouTube', href: 'https://www.youtube.com/@MetaAssets_MA' },
        { label: 'Instagram', href: 'https://www.instagram.com/metaassets_ma' },
        { label: 'Blog', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press Kit', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Privacy Policy', href: '#' },
      ],
    },
  ];

  const linkColumns = columns.length > 0 ? columns : defaultColumns;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoSrc} alt={brandName} />
              <span>{brandName}</span>
            </div>
            <p className="footer-desc">{description}</p>
            <div className="footer-socials">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="footer-social"
                  aria-label={s.icon}
                  target={s.href !== '#' ? '_blank' : undefined}
                  rel={s.href !== '#' ? 'noopener noreferrer' : undefined}
                >
                  {socialIcons[s.icon]}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-links">
            {linkColumns.map((col, i) => (
              <div className="footer-col" key={i}>
                <h4>{col.title}</h4>
                {col.links.map((link, j) => (
                  <a key={j} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
