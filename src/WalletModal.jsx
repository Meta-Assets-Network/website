import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'

const CHAIN_ID = 20260131

const WALLET_LOGOS = {
  metaMask: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/assets/SVG/MetaMask-icon.svg',
  tokenPocket: 'https://tokenpocket-pro.s3.ap-east-1.amazonaws.com/logo/TP.png',
  okx: 'https://www.okx.com/cdn/assets.OKX/ord/okx-wallet-logo.png',
  phantom: 'https://phantom.app/img/logo.png',
  coinbase: 'https://www.coinbase.com/og-cover.png',
  injected: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
}

function getWalletInfo(connector) {
  const id = connector.id.toLowerCase()
  const name = connector.name

  if (id.includes('metamask') || name.toLowerCase().includes('metamask')) {
    return { name: 'MetaMask', logo: WALLET_LOGOS.metaMask, key: 'metaMask' }
  }
  if (id.includes('phantom') || name.toLowerCase().includes('phantom')) {
    return { name: 'Phantom', logo: WALLET_LOGOS.phantom, key: 'phantom' }
  }
  if (id.includes('tokenpocket') || name.toLowerCase().includes('tokenpocket')) {
    return { name: 'TokenPocket', logo: WALLET_LOGOS.tokenPocket, key: 'tokenPocket' }
  }
  if (id.includes('okx') || name.toLowerCase().includes('okx')) {
    return { name: 'OKX Wallet', logo: WALLET_LOGOS.okx, key: 'okx' }
  }
  if (id.includes('coinbase') || name.toLowerCase().includes('coinbase')) {
    return { name: 'Coinbase Wallet', logo: WALLET_LOGOS.coinbase, key: 'coinbase' }
  }
  if (id === 'injected' || id === 'browser wallet') {
    return { name: 'Browser Wallet', logo: WALLET_LOGOS.injected, key: 'injected' }
  }

  return { name: connector.name || 'Unknown', logo: WALLET_LOGOS.injected, key: id }
}

export function WalletModal({ onClose }) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const handleConnect = (connector) => {
    connect({ connector })
    onClose()
  }

  const handleSwitchChain = () => {
    switchChain({ chainId: CHAIN_ID })
  }

  if (isConnected) {
    return (
      <div className="wallet-modal-overlay" onClick={onClose}>
        <div className="wallet-modal" onClick={e => e.stopPropagation()}>
          <div className="wallet-modal-header">
            <h3>Wallet</h3>
            <button className="wallet-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="wallet-modal-content">
            {error && <div className="wallet-error">{error.message}</div>}
            <div className="wallet-info">
              <div className="wallet-address">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              {chain?.id !== CHAIN_ID && (
                <button className="wallet-switch-btn" onClick={handleSwitchChain}>
                  Switch to MA Chain
                </button>
              )}
              {chain?.id === CHAIN_ID && (
                <div className="wallet-chain-badge">MA Chain</div>
              )}
            </div>
            <button className="wallet-disconnect-btn" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={e => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button className="wallet-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="wallet-modal-content">
          {error && <div className="wallet-error">{error.message}</div>}
          {connectors.map((connector) => {
            const wallet = getWalletInfo(connector)
            return (
              <button
                key={connector.uid}
                className="wallet-option"
                onClick={() => handleConnect(connector)}
                disabled={isPending}
              >
                <img
                  src={wallet.logo}
                  alt={wallet.name}
                  className="wallet-option-logo"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <span className="wallet-option-name">{wallet.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
