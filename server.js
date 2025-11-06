const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Fixed exchange rates (same as frontend)
const FIXED_RATES = {
    BTC: 165870,
    ETH: 5909,
    TRX: 0.540,
    BNB: 1499
};

// Security: Validate environment variables on startup
if (!NOW_API_KEY || NOW_API_KEY === 'DEMO_API_KEY_12345') {
    console.warn('⚠️  WARNING: Using DEMO API key. Set real NOW_API_KEY in .env file.');
}

if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'DEMO_WEBHOOK_SECRET') {
    console.warn('⚠️  WARNING: Using DEMO webhook secret. Set real WEBHOOK_SECRET in .env file.');
}

// Security: Don't expose sensitive config in logs
if (process.env.NODE_ENV !== 'production') {
    console.log('🔐 Security Check:');
    console.log('   API Key:', NOW_API_KEY ? '✓ Configured' : '✗ Missing');
    console.log('   Webhook Secret:', WEBHOOK_SECRET ? '✓ Configured' : '✗ Missing');
}

// Demo NowPayments API credentials (replace with real ones)
const NOW_API_KEY = process.env.NOW_API_KEY || 'DEMO_API_KEY_12345';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'DEMO_WEBHOOK_SECRET';

// Orders file path
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Initialize orders file if it doesn't exist
async function initOrdersFile() {
    try {
        await fs.access(ORDERS_FILE);
    } catch {
        await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    }
}

// Read orders from file
async function readOrders() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading orders:', error);
        return [];
    }
}

// Write orders to file
async function writeOrders(orders) {
    try {
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    } catch (error) {
        console.error('Error writing orders:', error);
    }
}

// Generate demo payment address based on coin type
function generateDemoPaymentAddress(coin) {
    const addresses = {
        BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        TRX: 'TRX9aJ76vFPNDtmfzE4WTLK6q9pNQKPxf7',
        BNB: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2'
    };
    return addresses[coin] || addresses.BTC;
}

// API Route: Create Payment
app.post('/api/create-payment', async (req, res) => {
    try {
        const { coin, amount, receiveMethod, receiveWallet, usdValue } = req.body;

        // Validate inputs
        if (!coin || !amount || !receiveMethod || !receiveWallet || !usdValue) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Validate USD calculation
        const expectedUSD = (amountNum * FIXED_RATES[coin]).toFixed(2);
        if (Math.abs(parseFloat(expectedUSD) - parseFloat(usdValue)) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'USD value mismatch'
            });
        }

        // Generate order ID
        const orderId = 'NP' + crypto.randomBytes(6).toString('hex').toUpperCase();

        try {
            // Call NowPayments API to create invoice
            const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
                method: 'POST',
                headers: {
                    'x-api-key': NOW_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    price_amount: parseFloat(usdValue),
                    price_currency: 'usd',
                    pay_currency: coin.toLowerCase(),
                    order_id: orderId,
                    order_description: `Exchange ${amount} ${coin} to ${receiveMethod}`,
                    ipn_callback_url: `${process.env.BASE_URL}/webhook/payment?secret=${WEBHOOK_SECRET}`,
                    success_url: `${process.env.BASE_URL}/payment.html?order_id=${orderId}`,
                    cancel_url: `${process.env.BASE_URL}/index.html`
                })
            });

            if (!nowPaymentsResponse.ok) {
                const errorData = await nowPaymentsResponse.json();
                console.error('❌ NowPayments API Error:', errorData);
                throw new Error(errorData.message || 'NowPayments API failed');
            }

            const invoiceData = await nowPaymentsResponse.json();
            console.log('✅ NowPayments Invoice Created:', invoiceData.id);

            // Create order object with REAL payment address from NowPayments
            const order = {
                order_id: orderId,
                invoice_id: invoiceData.id,
                coin: coin,
                amount: amount,
                usd_value: usdValue,
                receive_method: receiveMethod,
                receive_wallet: receiveWallet,
                payment_address: invoiceData.pay_address,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // Save order to file
            const orders = await readOrders();
            orders.push(order);
            await writeOrders(orders);

            console.log('✅ Order created with REAL payment address:', orderId);

            res.json({
                success: true,
                order_id: orderId,
                payment_address: order.payment_address
            });

        } catch (apiError) {
            console.error('❌ NowPayments API Error:', apiError.message);
            
            // Fallback to demo mode if API fails
            console.log('⚠️ Falling back to DEMO mode');
            const order = {
                order_id: orderId,
                coin: coin,
                amount: amount,
                usd_value: usdValue,
                receive_method: receiveMethod,
                receive_wallet: receiveWallet,
                payment_address: generateDemoPaymentAddress(coin),
                status: 'pending',
                created_at: new Date().toISOString(),
                demo_mode: true
            };

            const orders = await readOrders();
            orders.push(order);
            await writeOrders(orders);

            res.json({
                success: true,
                order_id: orderId,
                payment_address: order.payment_address,
                warning: 'Using demo mode - API connection failed'
            });
        }

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// API Route: Get Order Details
app.get('/api/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = await readOrders();
        const order = orders.find(o => o.order_id === orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Webhook Route: Payment Status Update
app.post('/webhook/payment', async (req, res) => {
    try {
        const { secret } = req.query;
        
        // Validate webhook secret
        if (secret !== WEBHOOK_SECRET) {
            console.log('❌ Invalid webhook secret');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const webhookData = req.body;
        console.log('📥 Webhook received:', webhookData);

        // Extract order ID and payment status
        const orderId = webhookData.order_id;
        const paymentStatus = webhookData.payment_status; // 'finished', 'confirmed', etc.

        if (!orderId) {
            return res.status(400).json({ error: 'Missing order_id' });
        }

        // Update order status
        const orders = await readOrders();
        const orderIndex = orders.findIndex(o => o.order_id === orderId);

        if (orderIndex !== -1) {
            // Update status based on payment_status
            if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
                orders[orderIndex].status = 'paid';
                orders[orderIndex].paid_at = new Date().toISOString();
                console.log(`✅ Order ${orderId} marked as PAID`);
            } else {
                orders[orderIndex].status = paymentStatus;
            }

            await writeOrders(orders);

            // Here you can trigger additional actions:
            // - Send email notification
            // - Process USDT transfer
            // - Update external systems
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Demo Route: Simulate Payment (for testing)
app.post('/api/demo/complete-payment/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = await readOrders();
        const orderIndex = orders.findIndex(o => o.order_id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        orders[orderIndex].status = 'paid';
        orders[orderIndex].paid_at = new Date().toISOString();
        await writeOrders(orders);

        console.log(`✅ Demo: Order ${orderId} marked as PAID`);

        res.json({
            success: true,
            message: 'Payment simulated successfully'
        });

    } catch (error) {
        console.error('Error simulating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Initialize and start server
async function startServer() {
    await initOrdersFile();
    
    app.listen(PORT, () => {
        console.log('🚀 ONE⚡CASH Server running on port', PORT);
        console.log('📝 API Endpoints:');
        console.log('   POST /api/create-payment - Create new exchange order');
        console.log('   GET  /api/order/:orderId - Get order details');
        console.log('   POST /webhook/payment - NowPayments webhook');
        console.log('   POST /api/demo/complete-payment/:orderId - Simulate payment (demo)');
        console.log('');
        console.log('🌐 Access website at: http://localhost:' + PORT);
        console.log('');
        console.log('⚙️  Using DEMO API credentials');
        console.log('   Replace with real NowPayments API key in production');
    });
}

startServer();
