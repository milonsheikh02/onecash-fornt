// ONE⚡CASH Exchange Form Handler

// Exchange rates (mock values - in a real system, these would come from an API)
const exchangeRates = {
  'BTC': 89,458.10,  // 1 BTC = 89,458.10 USDT
  'ETH': 2,917.17,    // 1 ETH = 2,917.17 USDT
  'TRX': 0.28210    // 1 TRX = 0.28210 USDT
};

// DOM Elements
const exchangeForm = document.getElementById('exchangeForm');
const sendCoinSelect = document.getElementById('sendCoin');
const sendAmountInput = document.getElementById('sendAmount');
const usdValueInput = document.getElementById('usdValue');
const coinHint = document.getElementById('coinHint');

// Update USD value when coin or amount changes
function updateUsdValue() {
  const coin = sendCoinSelect.value;
  const amount = parseFloat(sendAmountInput.value) || 0;
  
  if (coin && amount > 0) {
    const rate = exchangeRates[coin] || 0;
    const usdValue = amount * rate;
    usdValueInput.value = usdValue.toFixed(2) + ' USD';
    document.getElementById('rateInfo').textContent = `1 ${coin} = ${rate} USD`;
  } else {
    usdValueInput.value = '0.00 USD';
    document.getElementById('rateInfo').textContent = '';
  }
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const formData = {
    sendCoin: sendCoinSelect.value,
    sendAmount: sendAmountInput.value,
    receiveMethod: document.getElementById('receiveMethod').value,
    receiveWallet: document.getElementById('receiveWallet').value,
    // In a real implementation, you would associate this with a user session
    userId: 'USER_' + Date.now() // Temporary user ID for demo
  };
  
  // Validate form
  if (!formData.sendCoin || !formData.sendAmount || !formData.receiveMethod || !formData.receiveWallet) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    // Show loading state
    const submitButton = document.querySelector('.btn-exchange');
    const originalText = submitButton ? submitButton.textContent : 'Exchange Now';
    if (submitButton) {
      submitButton.textContent = 'Processing...';
      submitButton.disabled = true;
    }
    
    // For local development, generate mock order data and redirect
    // In production, this would connect to the backend API
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname === '0.0.0.0' ||
                   window.location.hostname.includes('local') ||
                   window.location.hostname.includes('preview') ||
                   window.location.hostname.includes('workers.dev');
    
    // Debugging: Log the hostname and isLocal status
    console.log('Current hostname:', window.location.hostname);
    console.log('Is local environment:', isLocal);
    console.log('Worker URL:', window.CONFIG.WORKER_URL);
    
    if (isLocal) {
      // Generate mock order data for local development
      const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      const mockOrder = {
        order_id: orderId,
        amount: parseFloat(formData.sendAmount),
        coin: formData.sendCoin,
        usd_value: parseFloat(formData.sendAmount) * exchangeRates[formData.sendCoin],
        receive_method: formData.receiveMethod,
        receive_wallet: formData.receiveWallet,
        payment_address: generateMockAddress(formData.sendCoin, orderId),
        status: 'pending'
      };
      
      // Store mock order data in sessionStorage for the payment page to use
      sessionStorage.setItem('mockOrder', JSON.stringify(mockOrder));
      console.log('Stored mock order in sessionStorage:', mockOrder);
      
      // Redirect to payment page with order ID
      window.location.href = `payment.html?order_id=${mockOrder.order_id}`;
    } else {
      // Create order via backend API (production)
      // Ensure the worker URL doesn't have a trailing slash
      const workerUrl = window.CONFIG.WORKER_URL.replace(/\/$/, '');
      const apiUrl = `${workerUrl}/api/order`;
      console.log('Sending request to backend:', apiUrl);
      console.log('Request data:', formData);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        console.log('Backend response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Backend response data:', result);
        
        if (result.success) {
          // Redirect to payment page with order ID
          window.location.href = `payment.html?order_id=${result.order.order_id}`;
        } else {
          throw new Error(result.error || 'Failed to create order');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert(`Error: ${error.message}`);
  } finally {
    // Restore button state
    const submitButton = document.querySelector('.btn-exchange');
    if (submitButton) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }
}

// Generate a mock payment address (HD wallet style - derived from main wallet)
function generateMockAddress(coin, orderId) {
  // In local development, we'll generate a deterministic address
  // This simulates the HD wallet generation on the backend
  const mainWallets = window.CONFIG.MAIN_WALLETS || {
    'BTC': 'bc1qk263esw8mxpcmmml0mus7nfnscp9fryyqqzgwq',
    'ETH': '0x2bb183CC12315a2acd0bfA89e815E1fC2C58815B',
    'TRX': 'TUop15AqkgbB7uXjiHDp1XDpDfBJEQUB7w'
  };
  
  const mainWallet = mainWallets[coin] || '0x0000000000000000000000000000000000000000';
  
  // Simple deterministic address generation (similar to backend)
  const prefixes = {
    'BTC': 'bc1',
    'ETH': '0x',
    'TRX': 'T'
  };
  
  const prefix = prefixes[coin] || '0x';
  
  // Create a pseudo-HD address by combining main wallet, coin type, and order ID
  const seed = `${mainWallet}${coin}${orderId || ''}`;
  
  // Simple hash-like function for demo purposes
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate address based on the hash
  let address = prefix;
  
  if (coin === 'ETH') {
    // Ethereum addresses are 40 hex characters (42 with 0x prefix)
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 40; i++) {
      const index = (hash + i) % hexChars.length;
      address += hexChars.charAt(Math.abs(index));
    }
  } else {
    // For other coins, use the original method
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Use the hash to generate a deterministic address
    const length = coin === 'BTC' ? 42 : 
                   coin === 'ETH' ? 40 : 
                   coin === 'TRX' ? 34 : 40;
    
    for (let i = 0; i < length - prefix.length; i++) {
      const index = (hash + i) % chars.length;
      address += chars.charAt(Math.abs(index));
    }
  }
  
  return address;
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners
  if (sendCoinSelect) {
    sendCoinSelect.addEventListener('change', updateUsdValue);
  }
  if (sendAmountInput) {
    sendAmountInput.addEventListener('input', updateUsdValue);
  }
  
  // Form submission
  if (exchangeForm) {
    exchangeForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Set minimum amount based on selected coin
  if (sendCoinSelect && sendAmountInput && coinHint) {
    sendCoinSelect.addEventListener('change', () => {
      const coin = sendCoinSelect.value;
      if (coin) {
        const minAmounts = {
          'BTC': 0.0001,
          'ETH': 0.001,
          'TRX': 10
        };
        const minAmount = minAmounts[coin] || 0.001;
        sendAmountInput.min = minAmount;
        coinHint.textContent = `Minimum: ${minAmount} ${coin}`;
      } else {
        coinHint.textContent = '';
      }
    });
  }
});
