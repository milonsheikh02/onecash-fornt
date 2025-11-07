// Patched script.js — frontend should NOT contain API keys.
// It calls backend endpoints on the same origin: /api/create-payment and /api/order/:orderId

const FIXED_RATES = {
    BTC: 165870,
    ETH: 5909,
    TRX: 0.540,
    BNB: 1499
};

const exchangeForm = document.getElementById('exchangeForm');
const sendCoinSelect = document.getElementById('sendCoin');
const sendAmountInput = document.getElementById('sendAmount');
const usdValueInput = document.getElementById('usdValue');
const rateInfo = document.getElementById('rateInfo');

if (exchangeForm) {
    function updateUsd() {
        const coin = sendCoinSelect.value;
        const amount = parseFloat(sendAmountInput.value) || 0;
        const rate = FIXED_RATES[coin] || 1;
        const usd = (amount * rate).toFixed(2);
        usdValueInput.value = usd;
        if (rateInfo) rateInfo.textContent = `1 ${coin} ≈ $${rate.toLocaleString()} USD`;
    }
    sendCoinSelect.addEventListener('change', updateUsd);
    sendAmountInput.addEventListener('input', updateUsd);

    exchangeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sendCoin = sendCoinSelect.value;
        const sendAmount = parseFloat(sendAmountInput.value);
        const usdValue = parseFloat(usdValueInput.value);
        const receiveWallet = document.getElementById('receiveWalletInput') ? document.getElementById('receiveWalletInput').value : null;

        if (!sendAmount || sendAmount <= 0) {
            alert('Please enter a valid amount to send.');
            return;
        }

        const payload = { sendCoin, sendAmount, usdValue, receiveWallet, description: `Exchange ${sendAmount} ${sendCoin}` };

        try {
            const resp = await fetch('https://onncx.com/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const err = await resp.json().catch(()=>({message:'Unknown error'}));
                alert('Failed to create payment: ' + (err.message || resp.statusText));
                return;
            }

            const data = await resp.json();
            if (data && data.orderId) {
                window.location.href = `payment.html?order_id=${encodeURIComponent(data.orderId)}`;
            } else if (data && data.invoice && data.invoice.invoice_url) {
                // fallback to invoice url
                window.location.href = data.invoice.invoice_url;
            } else {
                alert('Unexpected response from server.');
            }
        } catch (err) {
            console.error(err);
            alert('Network error while creating payment.');
        }
    });

    updateUsd();
}
