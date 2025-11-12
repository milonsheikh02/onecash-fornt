// Cloudflare Worker for ONE⚡CASH Payment Processing
// API Configuration
const API_KEY = 'CQVCKV8-N9ZM00R-J1R4F3H-3WW8D8N';
const WEBHOOK_URL = 'https://hook.eu2.make.com/3DGENEqiuxGMmYaB35alKsswjYlnIhlF';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight requests
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders,
  });
}

// Health check endpoint
function handleHealthCheck() {
  return new Response(JSON.stringify({
    success: true,
    message: 'ONE⚡CASH Payment API is running',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Generate a unique order ID
function generateOrderId() {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Generate a payment address (in a real implementation, this would integrate with a payment service)
function generatePaymentAddress(coin) {
  // This is a mock implementation - in a real system, you would integrate with a crypto payment processor
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

// Create a new order
async function createOrder(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.sendCoin || !data.sendAmount || !data.receiveMethod || !data.receiveWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Generate order ID and payment address
    const orderId = generateOrderId();
    const paymentAddress = generatePaymentAddress(data.sendCoin);
    
    // Create order object
    const order = {
      order_id: orderId,
      amount: parseFloat(data.sendAmount),
      coin: data.sendCoin,
      usd_value: parseFloat(data.sendAmount) * 50000, // Mock conversion - in real system, get from exchange rate API
      receive_method: data.receiveMethod,
      receive_wallet: data.receiveWallet,
      payment_address: paymentAddress,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
    };
    
    // In a real implementation, you would store this in a database
    // For Cloudflare Workers, you could use KV storage or D1 database
    
    // Send webhook notification
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order_created',
          order: order
        })
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      order: order
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get order details
async function getOrder(request, env, orderId) {
  // In a real implementation, you would retrieve this from a database
  // For this demo, we'll return a mock order
  // In a production system, you would use env.ORDER_KV or env.DB to retrieve the order
  
  // Mock order data - in a real system, this would come from storage
  const mockOrder = {
    order_id: orderId,
    amount: 0.1,
    coin: 'BTC',
    usd_value: 5000,
    receive_method: 'USDT-TRC20',
    receive_wallet: 'TABC1234567890XYZ',
    payment_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    status: 'pending', // This would be updated based on payment verification
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
  
  return new Response(JSON.stringify({
    success: true,
    order: mockOrder
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Update order status
async function updateOrderStatus(request, env, orderId) {
  try {
    const data = await request.json();
    
    // In a real implementation, you would update the order in the database
    // For this demo, we'll just return success
    
    // Send webhook notification
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order_status_updated',
          order_id: orderId,
          status: data.status
        })
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order status updated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle incoming requests
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route handling
    if (request.method === 'GET' && path === '/health') {
      return handleHealthCheck();
    } else if (request.method === 'POST' && path === '/api/order') {
      return createOrder(request);
    } else if (request.method === 'GET' && path.startsWith('/api/order/')) {
      const orderId = path.split('/')[3];
      return getOrder(request, env, orderId);
    } else if (request.method === 'PUT' && path.startsWith('/api/order/')) {
      const orderId = path.split('/')[3];
      return updateOrderStatus(request, env, orderId);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Route not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};