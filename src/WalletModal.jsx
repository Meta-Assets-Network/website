import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import metamaskLogo from './assets/wallets/metamask.svg'
import phantomLogo from './assets/wallets/phantom.png'

const CHAIN_ID = 20260131

const WALLET_INFO = {
  metaMask: { name: 'MetaMask', logo: metamaskLogo, key: 'metaMask' },
  phantom: { name: 'Phantom', logo: phantomLogo, key: 'phantom' },
  tokenPocket: { name: 'TokenPocket', logo: 'https://tokenpocket-pro.s3.ap-east-1.amazonaws.com/logo/TP.png', key: 'tokenPocket' },
  okx: { name: 'OKX Wallet', logo: 'https://www.okx.com/cdn/assets.OKX/ord/okx-wallet-logo.png', key: 'okx' },
  coinbase: { name: 'Coinbase Wallet', logo: 'https://www.coinbase.com/og-cover.png', key: 'coinbase' },
  injected: { name: 'Browser Wallet', logo: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png', key: 'injected' },
}

function getWalletInfo(connector) {
  const id = connector.id.toLowerCase()
  const name = connector.name.toLowerCase()

  if (id.includes('metamask') || name.includes('metamask')) {
    return WALLET_INFO.metaMask
  }
  if (id.includes('phantom') || name.includes('phantom')) {
    return WALLET_INFO.phantom
  }
  if (id.includes('tokenpocket') || name.includes('tokenpocket')) {
    return WALLET_INFO.tokenPocket
  }
  if (id.includes('okx') || name.includes('okx')) {
    return WALLET_INFO.okx
  }
  if (id.includes('coinbase') || name.includes('coinbase')) {
    return WALLET_INFO.coinbase
  }
  if (id === 'injected') {
    return WALLET_INFO.injected
  }

  return { name: connector.name || 'Unknown', logo: WALLET_INFO.injected.logo, key: id }
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
                  onError={(e) => { e.target.src = WALLET_INFO.injected.logo }}
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
