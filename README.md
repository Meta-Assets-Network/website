# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## STAGING AI 客服预览

首页右下角的 AI 客服浮窗由 `src/components/SupportChatWidget.jsx` 提供。它只接受 FastGPT 的免登录分享链接，不在前端保存或发送 API Key。

本地预览时复制 `.env.example` 为 `.env.local`，填写 FastGPT 在“发布渠道 -> 免登录窗口”创建的 STAGING 分享链接：

```bash
VITE_FASTGPT_SHARE_URL=https://share.example/chat/share?shareId=...
```

然后执行 `npm run dev`。未配置链接时，浮窗会显示配置提示而不会发起请求。免登录分享链接可能产生团队额度消耗，请仅用于 STAGING 体验。

FastGPT 分享页内部的默认“AI 对话”图标由 FastGPT 自己渲染，应用设置中的头像上传仅支持 JPG/PNG/JPEG 静态图片，不能注入官网的 React 动画。官网浮窗使用独立的 MAC 绿色动态头像；如需统一分享页视觉，可在 FastGPT 应用信息设置中上传 MAC 静态图标。
