import { useState } from 'react';
import './SupportChatWidget.css';

// FastGPT 分享链接由部署环境注入。不要把 API Key 放进 Vite 客户端变量。
const FASTGPT_SHARE_URL = import.meta.env.VITE_FASTGPT_SHARE_URL || '';

function BloubInspiredAvatar({ size = 56, active = false }) {
  return (
    <span className={`mac-support-avatar${active ? ' is-active' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" role="presentation">
        <circle className="mac-support-avatar-orbit" cx="50" cy="50" r="42" />
        <path className="mac-support-avatar-body" d="M50 9C73 9 91 26 91 50S73 91 50 91 9 74 9 50 27 9 50 9Z" />
        <path className="mac-support-avatar-eye mac-support-avatar-eye-left" d="M36 39c-4 2-6 7-5 12s5 8 9 7c4-1 6-6 5-11s-5-9-9-8Z" />
        <path className="mac-support-avatar-eye mac-support-avatar-eye-right" d="M64 39c4 2 6 7 5 12s-5 8-9 7c-4-1-6-6-5-11s5-9 9-8Z" />
      </svg>
    </span>
  );
}

function SupportChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`mac-support-widget${open ? ' is-open' : ''}`}>
      {open && (
        <section className="mac-support-panel" aria-label="MAC 智能客服">
          <header className="mac-support-panel-header">
            <div className="mac-support-panel-title">
              <BloubInspiredAvatar size={38} active />
              <div>
                <strong>MAC 智能客服</strong>
                <span>STAGING · FastGPT</span>
              </div>
            </div>
            <button type="button" className="mac-support-close" onClick={() => setOpen(false)} aria-label="关闭客服窗口">×</button>
          </header>
          {FASTGPT_SHARE_URL ? (
            <iframe
              className="mac-support-frame"
              src={FASTGPT_SHARE_URL}
              title="MAC 智能客服"
              allow="clipboard-write"
            />
          ) : (
            <div className="mac-support-placeholder">
              <BloubInspiredAvatar size={84} />
              <h2>客服体验即将接入</h2>
              <p>设置 <code>VITE_FASTGPT_SHARE_URL</code> 后，这里会加载 FastGPT 的 STAGING 分享窗口。</p>
              <p className="mac-support-attribution">头像动画参考 bloub（MIT），已为 React 官网做轻量适配；与 x.ai 无关联。</p>
            </div>
          )}
        </section>
      )}
      <button
        type="button"
        className="mac-support-launcher"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-label={open ? '关闭 MAC 智能客服' : '打开 MAC 智能客服'}
      >
        <BloubInspiredAvatar active={open} />
        <span className="mac-support-launcher-label">AI 客服</span>
      </button>
    </div>
  );
}

export default SupportChatWidget;
