import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  imTokenWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  tokenPocketWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Meta Assets Chain — the only chain wallets connect to on this site.
export const metaAssetsChain = defineChain({
  id: 20260131,
  name: 'Meta Assets Chain',
  nativeCurrency: { name: 'MetaAssets', symbol: 'MA', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ma-chain.xyz'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://ma-chain.xyz' } },
});

// WalletConnect Cloud project id (https://cloud.walletconnect.com). Without a
// real id, WalletConnect's QR/deep-link flow (mobile) is degraded — but
// MetaMask / OKX / TokenPocket / imToken and any window.ethereum wallet still
// connect normally, since injected providers don't go through WalletConnect.
// Set VITE_WC_PROJECT_ID before relying on mobile WalletConnect in production.
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'guanwang-placeholder';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, okxWallet, tokenPocketWallet, imTokenWallet, injectedWallet],
    },
  ],
  { appName: 'Meta Assets', projectId: WC_PROJECT_ID },
);

export const config = createConfig({
  chains: [metaAssetsChain],
  connectors,
  transports: { [metaAssetsChain.id]: http('https://rpc.ma-chain.xyz') },
});
