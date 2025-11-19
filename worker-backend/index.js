// Cloudflare Worker for ONE⚡CASH Payment Processing
// Etherscan API Key (you'll need to get your own from etherscan.io)
const ETHERSCAN_API_KEY = typeof env !== 'undefined' && env.ETHERSCAN_API_KEY ? env.ETHERSCAN_API_KEY : 'PGMJTCIY14W8IT81NYR557NIDDUUU9Z5C1';

// Admin credentials (stored as secrets)
let ADMIN_USERNAME = typeof env !== 'undefined' && env.ADMIN_USERNAME ? env.ADMIN_USERNAME : 'admin';
let ADMIN_PASSWORD = typeof env !== 'undefined' && env.ADMIN_PASSWORD ? env.ADMIN_PASSWORD : 'password123';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// In-memory storage for orders (in production, use KV or D1)
const orders = new Map();

// In-memory storage for user balances (in production, use KV or D1)
const userBalances = new Map();

// In-memory storage for wallets (in production, use KV or D1)
const wallets = new Map();

// In-memory storage for transactions (in production, use KV or D1)
const transactions = new Map();

// In-memory storage for admin data
const adminData = {
  orders: [],
  wallets: [],
  transactions: []
};

// Exchange rates (in production, get from API)
const exchangeRates = {
  'BTC': 89,458.10 ,  // 1 BTC = 89,458.10 USDT
  'ETH': 2,917.17,    // 1 ETH = 2,917.17 USDT
  'TRX': 0.28210     // 1 TRX = 0.28210 USDT
};

// Supported trading pairs
const supportedPairs = {
  'BTC_TO_USDT': true,
  'ETH_TO_USDT': true,
  'TRX_TO_USDT': true
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

// Generate a unique user ID
function generateUserId() {
  return 'USER' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Get user balance
function getUserBalance(userId, currency) {
  if (!userBalances.has(userId)) {
    userBalances.set(userId, {});
  }
  
  const balances = userBalances.get(userId);
  return balances[currency] || 0;
}

// Update user balance
function updateUserBalance(userId, currency, amount) {
  if (!userBalances.has(userId)) {
    userBalances.set(userId, {});
  }
  
  const balances = userBalances.get(userId);
  balances[currency] = (balances[currency] || 0) + amount;
  
  // Ensure no negative balances
  if (balances[currency] < 0) {
    balances[currency] = 0;
  }
  
  userBalances.set(userId, balances);
  return balances[currency];
}

// Perform internal swap (no blockchain transaction)
function performInternalSwap(userId, fromCoin, fromAmount, toCoin, toAmount) {
  // Deduct fromCoin from user balance
  updateUserBalance(userId, fromCoin, -fromAmount);
  
  // Add toCoin to user balance
  updateUserBalance(userId, toCoin, toAmount);
  
  return {
    success: true,
    fromCoin: fromCoin,
    fromAmount: fromAmount,
    toCoin: toCoin,
    toAmount: toAmount,
    userId: userId,
    timestamp: new Date().toISOString()
  };
}

// Check Tron transactions for a specific address
async function checkTronTransactions(address) {
  try {
    // Using Tronscan API (free, no API key required for basic queries)
    const url = `https://apilist.tronscan.org/api/transaction?address=${address}&limit=50`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.data || [];
  } catch (error) {
    console.error('Error checking Tron transactions:', error);
    return [];
  }
}

// Check Bitcoin transactions for a specific address
async function checkBitcoinTransactions(address) {
  try {
    // Using Blockchain.info API (free, no API key required)
    const url = `https://blockchain.info/rawaddr/${address}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.txs || [];
  } catch (error) {
    console.error('Error checking Bitcoin transactions:', error);
    return [];
  }
}

// Check Ethereum transactions for a specific address
async function checkEthereumTransactions(address, startBlock = 0, env) {
  try {
    const apiKey = typeof env !== 'undefined' && env.ETHERSCAN_API_KEY ? env.ETHERSCAN_API_KEY : ETHERSCAN_API_KEY;
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.message === 'OK') {
      return data.result || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error checking Ethereum transactions:', error);
    return [];
  }
}

// Generate a payment address (HD wallet style - derived from main wallet)
function generatePaymentAddress(coin, userId, orderId) {
  // In a real implementation, this would use HD wallet derivation
  // For this demo, we'll generate deterministic addresses based on main wallet + user ID
  const mainWallets = {
    'BTC': 'bc1qk263esw8mxpcmmml0mus7nfnscp9fryyqqzgwq',
    'ETH': '0x2bb183CC12315a2acd0bfA89e815E1fC2C58815B',
    'TRX': 'TUop15AqkgbB7uXjiHDp1XDpDfBJEQUB7w'
  };
  
  const mainWallet = mainWallets[coin] || '0x0000000000000000000000000000000000000000';
  
  // Simple deterministic address generation (in production, use proper HD wallet derivation)
  const prefixes = {
    'BTC': 'bc1',
    'ETH': '0x',
    'TRX': 'T'
  };
  
  const prefix = prefixes[coin] || '0x';
  
  // Create a pseudo-HD address by combining main wallet, user ID, coin type, and order ID
  // This is a simplified version - in production, use proper HD wallet libraries
  const seed = `${mainWallet}${userId}${coin}${orderId || ''}`;
  
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
    
    // Generate user ID if not provided
    const userId = data.userId || generateUserId();
    
    // Generate order ID and payment address
    const orderId = generateOrderId();
    const paymentAddress = generatePaymentAddress(data.sendCoin, userId, orderId);
    
    // Calculate USD value based on exchange rates
    const exchangeRate = exchangeRates[data.sendCoin] || 50000;
    const usdValue = parseFloat(data.sendAmount) * exchangeRate;
    
    // Determine receive coin from receive method
    let receiveCoin = 'USDT';
    if (data.receiveMethod.includes('TRC20')) {
      receiveCoin = 'USDT_TRC20';
    } else if (data.receiveMethod.includes('ERC20')) {
      receiveCoin = 'USDT_ERC20';
    }
    
    // Create order object
    const order = {
      id: Date.now(), // Simple ID for demo
      order_id: orderId,
      user_id: userId,
      send_network: data.sendCoin,
      receive_network: receiveCoin,
      send_amount: parseFloat(data.sendAmount),
      receive_amount: usdValue, // For simplicity, 1 USD = 1 USDT
      deposit_address: paymentAddress,
      status: 'pending',
      confirmations: 0,
      tx_hash: '',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
    };
    
    // Store order in memory (in production, use KV or D1)
    orders.set(orderId, order);
    
    // Add to admin data
    adminData.orders.push({
      id: order.id,
      order_id: order.order_id,
      send_network: order.send_network,
      receive_network: order.receive_network,
      send_amount: order.send_amount,
      receive_amount: order.receive_amount,
      deposit_address: order.deposit_address,
      status: order.status,
      confirmations: order.confirmations,
      tx_hash: order.tx_hash,
      created_at: order.created_at
    });
    
    // No webhook notification (as requested)
    
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
  try {
    // Retrieve order from storage
    const order = orders.get(orderId);
    
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      error: 'Failed to retrieve order: ' + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Update order status
async function updateOrderStatus(request, env, orderId) {
  try {
    const data = await request.json();
    
    // Retrieve order from storage
    const order = orders.get(orderId);
    
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Update order status
    const oldStatus = order.status;
    order.status = data.status;
    orders.set(orderId, order);
    
    // If order is now paid, perform internal swap
    if (oldStatus !== 'paid' && data.status === 'paid') {
      // Perform internal swap (no blockchain transaction)
      const swapResult = performInternalSwap(
        order.user_id,
        order.send_network,
        order.send_amount,
        order.receive_network,
        order.receive_amount
      );
      
      console.log('Internal swap performed:', swapResult);
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
    console.log('Request method:', request.method);
    console.log('Request path:', path);
    console.log('Path length:', path.length);
    console.log('Path parts:', path.split('/'));
    
    if (request.method === 'GET' && path === '/health') {
      console.log('Matched GET /health route');
      return handleHealthCheck();
    } else if (request.method === 'GET' && path === '/test') {
      console.log('Matched GET /test route');
      return new Response(JSON.stringify({
        success: true,
        message: 'Test endpoint working'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'GET' && path === '/test-swap') {
      console.log('Matched GET /test-swap route');
      
      // Test internal swap
      const testUserId = 'TEST_USER';
      const initialBalance = getUserBalance(testUserId, 'BTC');
      
      // Perform a test swap
      const swapResult = performInternalSwap(testUserId, 'BTC', 0.1, 'USDT', 5000);
      
      const finalBalance = {
        BTC: getUserBalance(testUserId, 'BTC'),
        USDT: getUserBalance(testUserId, 'USDT')
      };
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Test swap completed',
        initialBalance: initialBalance,
        swapResult: swapResult,
        finalBalance: finalBalance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST' && path === '/api/order') {
      console.log('Matched POST /api/order route');
      return createOrder(request);
    } else if (request.method === 'GET' && path.startsWith('/api/order/')) {
      const pathParts = path.split('/');
      const orderId = pathParts[3];
      console.log('Matched GET /api/order/ route, pathParts:', pathParts, 'orderId:', orderId);
      return getOrder(request, env, orderId);
    } else if (request.method === 'PUT' && path.startsWith('/api/order/')) {
      const pathParts = path.split('/');
      const orderId = pathParts[3];
      console.log('Matched PUT /api/order/ route, pathParts:', pathParts, 'orderId:', orderId);
      return updateOrderStatus(request, env, orderId);
    } else if (request.method === 'GET' && path.startsWith('/api/user/')) {
      // Get user balance
      const pathParts = path.split('/');
      const userId = pathParts[3];
      console.log('Matched GET /api/user/ route, pathParts:', pathParts, 'userId:', userId);
      
      if (pathParts[4] === 'balance') {
        const balances = userBalances.get(userId) || {};
        return new Response(JSON.stringify({
          success: true,
          userId: userId,
          balances: balances
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (request.method === 'GET' && path.startsWith('/api/check-payment/')) {
      // Check payment for an order
      const pathParts = path.split('/');
      const orderId = pathParts[3];
      console.log('Matched GET /api/check-payment/ route, pathParts:', pathParts, 'orderId:', orderId);
      
      const order = orders.get(orderId);
      if (!order) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Order not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check transactions for the payment address
      let transactions = [];
      if (order.send_network === 'BTC') {
        transactions = await checkBitcoinTransactions(order.deposit_address);
      } else if (order.send_network === 'ETH') {
        transactions = await checkEthereumTransactions(order.deposit_address, 0, env);
      } else if (order.send_network === 'TRX') {
        transactions = await checkTronTransactions(order.deposit_address);
      }
      
      // Process transactions to find matching payments
      const paymentInfo = {
        orderId: orderId,
        expectedAmount: order.send_amount,
        receivedAmount: 0,
        transactions: transactions.length,
        status: 'pending'
      };
      
      return new Response(JSON.stringify({
        success: true,
        paymentInfo: paymentInfo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'GET' && path === '/api/admin/data') {
      // Admin endpoint to get all data - requires authentication
      console.log('Matched GET /api/admin/data route');
      
      // Check authentication
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Basic ')) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 
            ...corsHeaders, 
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        });
      }
      
      // Decode basic auth
      const credentials = atob(auth.split(' ')[1]);
      const [username, password] = credentials.split(':');
      
      // Check credentials
      const adminUsername = typeof env !== 'undefined' && env.ADMIN_USERNAME ? env.ADMIN_USERNAME : ADMIN_USERNAME;
      const adminPassword = typeof env !== 'undefined' && env.ADMIN_PASSWORD ? env.ADMIN_PASSWORD : ADMIN_PASSWORD;
      
      if (username !== adminUsername || password !== adminPassword) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 
            ...corsHeaders, 
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: adminData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'GET' && path === '/admin') {
      // Serve admin panel HTML - requires authentication
      console.log('Matched GET /admin route');
      
      // Check authentication
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Basic ')) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 
            ...corsHeaders, 
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        });
      }
      
      // Decode basic auth
      const credentials = atob(auth.split(' ')[1]);
      const [username, password] = credentials.split(':');
      
      // Check credentials
      const adminUsername = typeof env !== 'undefined' && env.ADMIN_USERNAME ? env.ADMIN_USERNAME : ADMIN_USERNAME;
      const adminPassword = typeof env !== 'undefined' && env.ADMIN_PASSWORD ? env.ADMIN_PASSWORD : ADMIN_PASSWORD;
      
      if (username !== adminUsername || password !== adminPassword) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 
            ...corsHeaders, 
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
          }
        });
      }
      
      // Serve the admin.html file
      // In production, you would read this from a file or serve from a static asset
      const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ONE⚡CASH Admin Panel</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .admin-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .admin-header {
            background-color: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .admin-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            color: #6c757d;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .status-badge {
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        .status-completed {
            background-color: #cce5ff;
            color: #004085;
        }
        .action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .btn-primary {
            background-color: #007bff;
            color: white;
        }
        .btn-success {
            background-color: #28a745;
            color: white;
        }
        .btn-danger {
            background-color: #dc3545;
            color: white;
        }
        .logout-btn {
            float: right;
            background-color: #dc3545;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <h1>ONE⚡CASH Admin Panel</h1>
            <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
        
        <div class="admin-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="totalOrders">0</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="pendingOrders">0</div>
                    <div class="stat-label">Pending Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="completedOrders">0</div>
                    <div class="stat-label">Completed Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalRevenue">0</div>
                    <div class="stat-label">Total Revenue (USDT)</div>
                </div>
            </div>
            
            <h2>Recent Orders</h2>
            <table id="ordersTable">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Send Coin</th>
                        <th>Send Amount</th>
                        <th>Receive Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Orders will be populated here -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Check if user is authenticated
        function checkAuth() {
            // In a real implementation, you would check authentication status
            // For now, we'll assume the user is authenticated if they can access this page
        }

        // Logout function
        function logout() {
            // Clear any authentication tokens
            // Redirect to login page
            window.location.href = '/';
        }

        // Fetch admin data
        async function fetchAdminData() {
            try {
                const response = await fetch('/api/admin/data', {
                    headers: {
                        'Authorization': 'Basic ' + btoa('admin:password123') // Default credentials
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    updateAdminPanel(data.data);
                } else if (response.status === 401) {
                    // Redirect to login if not authenticated
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error fetching admin data:', error);
            }
        }

        // Update admin panel with data
        function updateAdminPanel(data) {
            // Update stats
            document.getElementById('totalOrders').textContent = data.orders.length;
            
            const pendingOrders = data.orders.filter(order => order.status === 'pending').length;
            document.getElementById('pendingOrders').textContent = pendingOrders;
            
            const completedOrders = data.orders.filter(order => order.status === 'completed').length;
            document.getElementById('completedOrders').textContent = completedOrders;
            
            const totalRevenue = data.orders
                .filter(order => order.status === 'completed')
                .reduce((sum, order) => sum + order.receive_amount, 0);
            document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2);
            
            // Update orders table
            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = '';
            
            // Show last 10 orders
            const recentOrders = data.orders.slice(-10).reverse();
            
            recentOrders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = '\n                    <td>' + order.order_id + '</td>\n                    <td>' + new Date(order.created_at).toLocaleDateString() + '</td>\n                    <td>' + order.send_network + '</td>\n                    <td>' + order.send_amount + '</td>\n                    <td>' + order.receive_amount.toFixed(2) + ' USDT</td>\n                    <td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>\n                    <td>\n                        <button class="action-btn btn-primary" onclick="viewOrder(\'' + order.order_id + '\')">View</button>\n                        ' + (order.status === 'pending' ? \n                            '<button class="action-btn btn-success" onclick="markAsPaid(\'' + order.order_id + '\')">Mark Paid</button>' : \n                            '') + '\n                    </td>\n                ';
                tbody.appendChild(row);
            });
        }

        // View order details
        function viewOrder(orderId) {
            alert('View order details for: ' + orderId);
            // In a real implementation, you would show order details in a modal or redirect to order page
        }

        // Mark order as paid
        function markAsPaid(orderId) {
            if (confirm('Mark order ' + orderId + ' as paid?')) {
                // In a real implementation, you would make an API call to update the order status
                alert('Order marked as paid');
                // Refresh the data
                fetchAdminData();
            }
        }

        // Initialize admin panel
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            fetchAdminData();
        });
    </script>
</body>
</html>`;
      return new Response(adminHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    } else {
      console.log('No route matched');
      return new Response(JSON.stringify({
        success: false,
        error: 'Route not found: ' + request.method + ' ' + path
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
