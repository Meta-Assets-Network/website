import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import metamaskLogo from './assets/wallets/metamask.svg'
import tokenPocketLogo from './assets/wallets/tokenpocket.svg'

const CHAIN_ID = 20260131

// Filter out wallets that don't support Ethereum
const ETHEREUM_WALLET_IDS = ['metaMask', 'tokenPocket', 'coinbaseWallet', 'okxWallet', 'injected']

function getWalletInfo(connector) {
  const id = connector.id.toLowerCase()
  const name = connector.name.toLowerCase()

  if (id.includes('metamask') || name.includes('metamask')) {
    return { name: 'MetaMask', logo: metamaskLogo, key: 'metaMask' }
  }
  if (id.includes('tokenpocket') || name.includes('tokenpocket')) {
    return { name: 'TokenPocket', logo: tokenPocketLogo, key: 'tokenPocket' }
  }
  if (id.includes('coinbase') || name.includes('coinbase')) {
    return { name: 'Coinbase Wallet', logo: 'https://www.coinbase.com/og-cover.png', key: 'coinbase' }
  }
  if (id.includes('okx') || name.includes('okx')) {
    return { name: 'OKX Wallet', logo: 'https://www.okx.com/cdn/assets.OKX/ord/okx-wallet-logo.png', key: 'okx' }
  }
  // Default to generic injected/browser wallet
  return { name: connector.name || 'Browser Wallet', logo: metamaskLogo, key: 'injected' }
}

export function WalletModal({ onClose }) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  // Filter connectors to only show Ethereum-compatible wallets
  const filteredConnectors = connectors.filter((connector) => {
    const id = connector.id.toLowerCase()
    const name = connector.name.toLowerCase()
    // Exclude Phantom and other non-Ethereum wallets
    if (id.includes('phantom') || name.includes('phantom')) return false
    if (id.includes('solana') || name.includes('solana')) return false
    if (id.includes('bitcoin') || name.includes('bitcoin')) return false
    return true
  })

  const handleConnect = (connector) => {
    connect({ connector })
    // Don't close modal on error - let user try again
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
          {filteredConnectors.length === 0 && (
            <div className="wallet-error">No Ethereum wallet detected</div>
          )}
          {filteredConnectors.map((connector) => {
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
