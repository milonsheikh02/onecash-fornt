// Web3 Wallet Connection Handler

// Show wallet modal
function showWalletModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('walletModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'walletModal';
    modal.className = 'wallet-modal';
    modal.innerHTML = `
      <div class="wallet-modal-content">
        <div class="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button class="close-modal" onclick="closeWalletModal()">&times;</button>
        </div>
        <div class="wallet-modal-body">
          <div class="wallet-option" onclick="connectWallet('metamask')">
            <strong>MetaMask</strong>
            <small>Connect with MetaMask browser extension</small>
          </div>
          <div class="wallet-option" onclick="connectWallet('coinbase')">
            <strong>Coinbase Wallet</strong>
            <small>Connect with Coinbase Wallet</small>
          </div>
          <div class="wallet-option" onclick="connectWallet('walletconnect')">
            <strong>WalletConnect</strong>
            <small>Connect with WalletConnect</small>
          </div>
          <div class="wallet-help">
            <p>Don't have a wallet?</p>
            <a href="https://metamask.io/" target="_blank">Get MetaMask</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Show modal
  modal.style.display = 'flex';
}

// Close wallet modal
function closeWalletModal() {
  const modal = document.getElementById('walletModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Connect wallet (mock implementation)
function connectWallet(walletType) {
  // In a real implementation, you would connect to the actual wallet
  // For this demo, we'll just show a success message
  
  closeWalletModal();
  
  // Show success message
  const walletStatus = document.getElementById('walletStatus');
  if (walletStatus) {
    walletStatus.innerHTML = `
      <div class="wallet-connected-msg">
        <span class="icon">✅</span>
        <div>
          <strong>Wallet Connected</strong>
          <small>Using mock address for demo</small>
        </div>
      </div>
    `;
    walletStatus.style.display = 'block';
    
    // Fill wallet address field with mock address
    const receiveWallet = document.getElementById('receiveWallet');
    if (receiveWallet) {
      receiveWallet.value = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    }
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const modal = document.getElementById('walletModal');
  if (modal && event.target === modal) {
    closeWalletModal();
  }
});