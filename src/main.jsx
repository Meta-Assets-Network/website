import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import WhitepaperTechnical from './WhitepaperTechnical.jsx'
import Tokenomics from './Tokenomics.jsx'
import AiAgent from './AiAgent.jsx'
import PoccConsensus from './PoccConsensus.jsx'
import VirtualRealIntegration from './VirtualRealIntegration.jsx'
import DecentralizedCollaboration from './DecentralizedCollaboration.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)
