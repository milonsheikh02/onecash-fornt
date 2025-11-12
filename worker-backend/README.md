# ONE⚡CASH Payment Processing Worker

This Cloudflare Worker handles payment processing for the ONE⚡CASH cryptocurrency exchange platform.

## Features

- Creates payment orders with unique order IDs
- Generates mock payment addresses for different cryptocurrencies
- Handles order status updates
- Sends webhook notifications for order events
- CORS-enabled for cross-origin requests

## API Endpoints

### Create Order
```
POST /api/order
```

**Request Body:**
```json
{
  "sendCoin": "BTC",
  "sendAmount": "0.1",
  "receiveMethod": "USDT-TRC20",
  "receiveWallet": "TABC1234567890XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "order_id": "ORD1234567890",
    "amount": 0.1,
    "coin": "BTC",
    "usd_value": 5000,
    "receive_method": "USDT-TRC20",
    "receive_wallet": "TABC1234567890XYZ",
    "payment_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "status": "pending",
    "created_at": "2023-10-01T12:00:00Z",
    "expires_at": "2023-10-01T12:10:00Z"
  }
}
```

### Get Order
```
GET /api/order/{order_id}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "order_id": "ORD1234567890",
    "amount": 0.1,
    "coin": "BTC",
    "usd_value": 5000,
    "receive_method": "USDT-TRC20",
    "receive_wallet": "TABC1234567890XYZ",
    "payment_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "status": "pending",
    "created_at": "2023-10-01T12:00:00Z",
    "expires_at": "2023-10-01T12:10:00Z"
  }
}
```

### Update Order Status
```
PUT /api/order/{order_id}
```

**Request Body:**
```json
{
  "status": "paid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated"
}
```

## Configuration

The worker uses the following environment variables:
- `API_KEY`: Your payment processor API key
- `WEBHOOK_URL`: URL to send order notifications

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```

## Integration with Frontend

The frontend should make requests to:
- Create orders: `https://api.onncx.com/api/order`
- Get order details: `https://api.onncx.com/api/order/{order_id}`
- Update order status: `https://api.onncx.com/api/order/{order_id}`

Note: In a production environment, you would store orders in Cloudflare KV or D1 database.