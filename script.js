// ONE⚡CASH Exchange Form Handler

// Exchange rates (mock values - in a real system, these would come from an API)
const exchangeRates = {
  'BTC': 50000,
  'ETH': 3000,
  'TRX': 0.1,
  'BNB': 400
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
    receiveWallet: document.getElementById('receiveWallet').value
  };
  
  // Validate form
  if (!formData.sendCoin || !formData.sendAmount || !formData.receiveMethod || !formData.receiveWallet) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    // Show loading state
    const submitButton = document.querySelector('.btn-exchange');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    // For local development, generate mock order data and redirect
    // In production, this would connect to the backend API
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      // Generate mock order data for local development
      const mockOrder = {
        order_id: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
        amount: parseFloat(formData.sendAmount),
        coin: formData.sendCoin,
        usd_value: parseFloat(formData.sendAmount) * exchangeRates[formData.sendCoin],
        receive_method: formData.receiveMethod,
        receive_wallet: formData.receiveWallet,
        payment_address: generateMockAddress(formData.sendCoin),
        status: 'pending'
      };
      
      // Store mock order data in sessionStorage for the payment page to use
      sessionStorage.setItem('mockOrder', JSON.stringify(mockOrder));
      
      // Redirect to payment page with order ID
      window.location.href = `payment.html?order_id=${mockOrder.order_id}`;
    } else {
      // Create order via backend API (production)
      const response = await fetch(`${window.CONFIG.WORKER_URL}/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to payment page with order ID
        window.location.href = `payment.html?order_id=${result.order.order_id}`;
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert(`Error: ${error.message}`);
  } finally {
    // Restore button state
    const submitButton = document.querySelector('.btn-exchange');
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Generate a mock payment address for local development
function generateMockAddress(coin) {
  const prefixes = {
    'BTC': '1',
    'ETH': '0x',
    'TRX': 'T',
    'BNB': 'bnb1'
  };
  
  const prefix = prefixes[coin] || '0x';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let address = prefix;
  
  // Generate random address
  for (let i = 0; i < (coin === 'BTC' ? 33 : 40); i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return address;
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners
  sendCoinSelect.addEventListener('change', updateUsdValue);
  sendAmountInput.addEventListener('input', updateUsdValue);
  
  // Form submission
  if (exchangeForm) {
    exchangeForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Set minimum amount based on selected coin
  sendCoinSelect.addEventListener('change', () => {
    const coin = sendCoinSelect.value;
    if (coin) {
      const minAmounts = {
        'BTC': 0.0001,
        'ETH': 0.001,
        'TRX': 10,
        'BNB': 0.01
      };
      const minAmount = minAmounts[coin] || 0.001;
      sendAmountInput.min = minAmount;
      coinHint.textContent = `Minimum: ${minAmount} ${coin}`;
    } else {
      coinHint.textContent = '';
    }
  });
});