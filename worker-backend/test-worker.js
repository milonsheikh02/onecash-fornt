// Test script for ONE⚡CASH Payment Worker

// Test health check endpoint
async function testHealthCheck() {
  try {
    const response = await fetch('http://localhost:8787/health');
    const data = await response.json();
    console.log('Health Check:', data);
  } catch (error) {
    console.error('Health Check Error:', error);
  }
}

// Test create order endpoint
async function testCreateOrder() {
  try {
    const response = await fetch('http://localhost:8787/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sendCoin: 'BTC',
        sendAmount: '0.1',
        receiveMethod: 'USDT-TRC20',
        receiveWallet: 'TABC1234567890XYZ'
      })
    });
    
    const data = await response.json();
    console.log('Create Order:', data);
    
    if (data.success) {
      // Test get order endpoint
      await testGetOrder(data.order.order_id);
    }
  } catch (error) {
    console.error('Create Order Error:', error);
  }
}

// Test get order endpoint
async function testGetOrder(orderId) {
  try {
    const response = await fetch(`http://localhost:8787/api/order/${orderId}`);
    const data = await response.json();
    console.log('Get Order:', data);
  } catch (error) {
    console.error('Get Order Error:', error);
  }
}

// Run tests
console.log('Testing ONE⚡CASH Payment Worker...');
testHealthCheck();
testCreateOrder();