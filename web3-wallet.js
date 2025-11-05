// Web3 Wallet Connection for ONE⚡CASH

// Detect wallet providers
const detectWallets = () => {
    const wallets = {
        metamask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        tronlink: typeof window.tronWeb !== 'undefined' && window.tronWeb.ready,
        binanceChain: typeof window.BinanceChain !== 'undefined'
    };
    return wallets;
};

// Connect MetaMask (for ERC20)
async function connectMetaMask() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed! Please install MetaMask wallet.');
            window.open('https://metamask.io/download/', '_blank');
            return null;
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        const userAddress = accounts[0];
        console.log('✅ MetaMask connected:', userAddress);

        // Get current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Network Chain ID:', chainId);

        // Ethereum Mainnet = 0x1
        // BSC Mainnet = 0x38
        // Polygon = 0x89

        const networkNames = {
            '0x1': 'Ethereum Mainnet',
            '0x38': 'BSC Mainnet',
            '0x89': 'Polygon Mainnet'
        };

        const networkName = networkNames[chainId] || 'Unknown Network';
        
        // Auto-fill wallet address
        document.getElementById('receiveWallet').value = userAddress;
        document.getElementById('receiveMethod').value = 'USDT-ERC20';

        // Update UI
        updateWalletUI(userAddress, 'MetaMask', networkName);

        return {
            address: userAddress,
            network: networkName,
            chainId: chainId
        };

    } catch (error) {
        console.error('MetaMask connection error:', error);
        if (error.code === 4001) {
            alert('You rejected the connection request.');
        } else {
            alert('Failed to connect MetaMask: ' + error.message);
        }
        return null;
    }
}

// Connect TronLink (for TRC20)
async function connectTronLink() {
    try {
        if (typeof window.tronWeb === 'undefined') {
            alert('TronLink is not installed! Please install TronLink wallet.');
            window.open('https://www.tronlink.org/', '_blank');
            return null;
        }

        // Wait for TronLink to be ready
        let attempts = 0;
        while (!window.tronWeb.ready && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.tronWeb.ready) {
            alert('Please unlock your TronLink wallet and try again.');
            return null;
        }

        const tronAddress = window.tronWeb.defaultAddress.base58;
        console.log('✅ TronLink connected:', tronAddress);

        if (!tronAddress) {
            alert('No Tron address found. Please unlock TronLink.');
            return null;
        }

        // Auto-fill wallet address
        document.getElementById('receiveWallet').value = tronAddress;
        document.getElementById('receiveMethod').value = 'USDT-TRC20';

        // Update UI
        updateWalletUI(tronAddress, 'TronLink', 'Tron Mainnet');

        return {
            address: tronAddress,
            network: 'Tron Mainnet'
        };

    } catch (error) {
        console.error('TronLink connection error:', error);
        alert('Failed to connect TronLink: ' + error.message);
        return null;
    }
}

// Update UI after wallet connection
function updateWalletUI(address, walletName, network) {
    // Shorten address for display (0x1234...5678)
    const shortAddress = address.substring(0, 6) + '...' + address.substring(address.length - 4);

    // Update button text if exists
    const connectBtn = document.getElementById('walletConnectBtn');
    if (connectBtn) {
        connectBtn.innerHTML = `✅ ${walletName} Connected<br><small>${shortAddress}</small>`;
        connectBtn.classList.add('connected');
    }

    // Show success message
    const statusDiv = document.getElementById('walletStatus');
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="wallet-connected-msg">
                <span class="icon">✅</span>
                <div>
                    <strong>${walletName} Connected</strong><br>
                    <small>${address}</small><br>
                    <small>Network: ${network}</small>
                </div>
            </div>
        `;
        statusDiv.style.display = 'block';
    }

    // Highlight the receive wallet input
    const walletInput = document.getElementById('receiveWallet');
    if (walletInput) {
        walletInput.style.borderColor = '#00ff88';
        walletInput.style.backgroundColor = '#e8fff5';
    }
}

// Disconnect wallet
function disconnectWallet() {
    document.getElementById('receiveWallet').value = '';
    
    const connectBtn = document.getElementById('walletConnectBtn');
    if (connectBtn) {
        connectBtn.innerHTML = '🦊 Connect Wallet';
        connectBtn.classList.remove('connected');
    }

    const statusDiv = document.getElementById('walletStatus');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }

    const walletInput = document.getElementById('receiveWallet');
    if (walletInput) {
        walletInput.style.borderColor = '';
        walletInput.style.backgroundColor = '';
    }

    console.log('Wallet disconnected');
}

// Show wallet selection modal
function showWalletModal() {
    const modal = document.getElementById('walletModal');
    if (!modal) {
        createWalletModal();
    }
    document.getElementById('walletModal').style.display = 'flex';
}

// Create wallet selection modal
function createWalletModal() {
    const modalHTML = `
        <div id="walletModal" class="wallet-modal" style="display: none;">
            <div class="wallet-modal-content">
                <div class="wallet-modal-header">
                    <h3>Connect Your Wallet</h3>
                    <button class="close-modal" onclick="closeWalletModal()">&times;</button>
                </div>
                <div class="wallet-modal-body">
                    <button class="wallet-option" onclick="connectMetaMask(); closeWalletModal();">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23f6851b'/%3E%3C/svg%3E" alt="MetaMask">
                        <div>
                            <strong>MetaMask</strong>
                            <small>For USDT-ERC20 (Ethereum)</small>
                        </div>
                    </button>
                    <button class="wallet-option" onclick="connectTronLink(); closeWalletModal();">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ff0013'/%3E%3C/svg%3E" alt="TronLink">
                        <div>
                            <strong>TronLink</strong>
                            <small>For USDT-TRC20 (Tron)</small>
                        </div>
                    </button>
                    <div class="wallet-help">
                        <p>Don't have a wallet?</p>
                        <a href="https://metamask.io/" target="_blank">Get MetaMask</a> | 
                        <a href="https://www.tronlink.org/" target="_blank">Get TronLink</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close wallet modal
function closeWalletModal() {
    document.getElementById('walletModal').style.display = 'none';
}

// Listen for account changes (MetaMask)
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            console.log('MetaMask disconnected');
            disconnectWallet();
        } else {
            console.log('Account changed:', accounts[0]);
            document.getElementById('receiveWallet').value = accounts[0];
            updateWalletUI(accounts[0], 'MetaMask', 'Network Changed');
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed:', chainId);
        window.location.reload(); // Reload page on network change
    });
}

// Listen for TronLink changes
if (typeof window.tronWeb !== 'undefined') {
    window.addEventListener('message', (e) => {
        if (e.data.message && e.data.message.action === 'setAccount') {
            console.log('TronLink account changed');
            if (window.tronWeb.ready) {
                const newAddress = window.tronWeb.defaultAddress.base58;
                document.getElementById('receiveWallet').value = newAddress;
                updateWalletUI(newAddress, 'TronLink', 'Tron Mainnet');
            }
        }
    });
}

// Check wallet connection on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        const wallets = detectWallets();
        console.log('🔍 Available wallets:', wallets);
        
        // Auto-detect if already connected
        if (wallets.metamask && window.ethereum.selectedAddress) {
            console.log('MetaMask already connected');
        }
        
        if (wallets.tronlink && window.tronWeb.ready) {
            console.log('TronLink already connected');
        }
    }, 1000);
});

// Export functions for global use
window.connectMetaMask = connectMetaMask;
window.connectTronLink = connectTronLink;
window.disconnectWallet = disconnectWallet;
window.showWalletModal = showWalletModal;
window.closeWalletModal = closeWalletModal;
