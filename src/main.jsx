import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App.jsx'
import WhitepaperTechnical from './WhitepaperTechnical.jsx'
import Tokenomics from './Tokenomics.jsx'
import AiAgent from './AiAgent.jsx'
import PoccConsensus from './PoccConsensus.jsx'
import VirtualRealIntegration from './VirtualRealIntegration.jsx'
import DecentralizedCollaboration from './DecentralizedCollaboration.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'
import TermsOfService from './TermsOfService.jsx'
import { config } from './walletConfig'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00E5C4',
            accentColorForeground: '#050D1A',
            borderRadius: 'large',
            overlayBlur: 'small',
          })}
          initialChain={config.chains[0]}
        >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/whitepaper-technical" element={<WhitepaperTechnical />} />
            <Route path="/tokenomics" element={<Tokenomics />} />
            <Route path="/ai-agent" element={<AiAgent />} />
            <Route path="/pocc-consensus" element={<PoccConsensus />} />
            <Route path="/virtual-real-integration" element={<VirtualRealIntegration />} />
            <Route path="/decentralized-collaboration" element={<DecentralizedCollaboration />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Routes>
        </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
