// Fixed exchange rates (USD)
const FIXED_RATES = {
    BTC: 165870,
    ETH: 5909,
    TRX: 0.540,
    BNB: 1499
};

// Get DOM elements
const exchangeForm = document.getElementById('exchangeForm');
const sendCoinSelect = document.getElementById('sendCoin');
const sendAmountInput = document.getElementById('sendAmount');
const usdValueInput = document.getElementById('usdValue');
const rateInfo = document.getElementById('rateInfo');
const coinHint = document.getElementById('coinHint');

// Update USD value when coin or amount changes
function updateUSDValue() {
    const selectedCoin = sendCoinSelect.value;
    const amount = parseFloat(sendAmountInput.value);

    if (selectedCoin && amount > 0) {
        const rate = FIXED_RATES[selectedCoin];
        const usdValue = (amount * rate).toFixed(2);
        
        usdValueInput.value = `${usdValue} USD`;
        rateInfo.textContent = `1 ${selectedCoin} = ${rate.toLocaleString()} USD`;
        coinHint.textContent = `You are sending ${selectedCoin}`;
    } else {
        usdValueInput.value = '';
        rateInfo.textContent = '';
        coinHint.textContent = '';
    }
}

// Event listeners for real-time calculation
sendCoinSelect.addEventListener('change', updateUSDValue);
sendAmountInput.addEventListener('input', updateUSDValue);

// Simplified input validation (no limits)
function validateInput(value, type) {
    if (typeof value !== 'string') return false;
    
    const cleanValue = value.trim();
    
    switch (type) {
        case 'coin':
            return !!cleanValue;
        case 'method':
            return !!cleanValue;
        case 'wallet':
            return !!cleanValue && cleanValue.length > 0;
        case 'amount':
            const amount = parseFloat(cleanValue);
            return !isNaN(amount); // No minimum limit
        default:
            return false;
    }
}

// Handle form submission with no security measures
exchangeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const coin = sendCoinSelect.value;
    const amount = sendAmountInput.value;
    const receiveMethod = document.getElementById('receiveMethod').value;
    const receiveWallet = document.getElementById('receiveWallet').value;
    const usdValue = usdValueInput.value.replace(' USD', '');

    console.log('Form values:', { coin, amount, receiveMethod, receiveWallet, usdValue });

    // Simple validation (no security checks)
    if (!validateInput(coin, 'coin') || 
        !validateInput(amount, 'amount') || 
        !validateInput(receiveMethod, 'method') || 
        !validateInput(receiveWallet, 'wallet')) {
        alert('Please fill in all fields');
        return;
    }

    // Show loading state
    const submitButton = exchangeForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Payment...';
    submitButton.disabled = true;

    try {
        // Send request to backend - Use Cloudflare Worker API endpoint
        console.log('Window CONFIG:', window.CONFIG);
        
        if (!window.CONFIG || !window.CONFIG.WORKER_URL) {
            throw new Error('Configuration not loaded properly');
        }
        
        const workerUrl = window.CONFIG.WORKER_URL;
        console.log('Worker URL:', workerUrl);
        
        const apiUrl = `${workerUrl}/api/create-payment`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coin,
                amount,
                receiveMethod,
                receiveWallet,
                usdValue
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            // Instead of redirecting, construct URL to your own payment page
            const paymentPageUrl = `payment.html?order_id=${data.order_id}`;
            window.location.href = paymentPageUrl;
        } else {
            // Show detailed error message
            alert('Error: ' + (data.message || 'Failed to create payment') + (data.error ? '\nDetails: ' + data.error : ''));
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.\nDetails: ' + error.message);
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Simple wallet address validation
function validateWalletAddress(address, method) {
    return address && typeof address === 'string' && address.length > 0;
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});