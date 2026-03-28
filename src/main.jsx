import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import WhitepaperTechnical from './WhitepaperTechnical.jsx'
import Tokenomics from './Tokenomics.jsx'
import AiAgent from './AiAgent.jsx'
import PoccConsensus from './PoccConsensus.jsx'
import VirtualRealIntegration from './VirtualRealIntegration.jsx'
import DecentralizedCollaboration from './DecentralizedCollaboration.jsx'
import { config } from './walletConfig'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/whitepaper-technical" element={<WhitepaperTechnical />} />
            <Route path="/tokenomics" element={<Tokenomics />} />
            <Route path="/ai-agent" element={<AiAgent />} />
            <Route path="/pocc-consensus" element={<PoccConsensus />} />
            <Route path="/virtual-real-integration" element={<VirtualRealIntegration />} />
            <Route path="/decentralized-collaboration" element={<DecentralizedCollaboration />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
