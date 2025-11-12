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
  
  // Generate random address with proper length for each coin type
  const length = coin === 'BTC' ? 33 : 
                 coin === 'ETH' ? 40 : 
                 coin === 'TRX' ? 33 : 
                 coin === 'BNB' ? 38 : 40;
  
  for (let i = 0; i < length; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
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
  }
});