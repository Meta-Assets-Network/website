import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';
import { injected } from 'wagmi/connectors';

// Meta Assets Chain config
const metaAssetsChain = {
  id: 20260131,
  name: 'Meta Assets Chain',
  nativeCurrency: { name: 'MetaAssets', symbol: 'MA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ma-chain.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://ma-chain.xyz' },
  },
  contracts: {},
} as const;

export const config = createConfig({
  chains: [metaAssetsChain, mainnet, polygon, arbitrum, optimism, base],
  transports: {
    [metaAssetsChain.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

export const supportedChains = [metaAssetsChain];
