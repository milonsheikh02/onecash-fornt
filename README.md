# ONE⚡CASH Cryptocurrency Exchange Platform

Welcome to the ONE⚡CASH cryptocurrency exchange platform! This repository contains all the files needed to deploy a complete cryptocurrency exchange service using Cloudflare's infrastructure.

## Project Structure

```
.
├── index.html          # Main exchange page
├── payment.html        # Payment processing page
├── faq.html            # Frequently Asked Questions
├── privacy.html        # Privacy Policy
├── support.html        # Support page
├── terms.html          # Terms of Service
├── style.css           # Global styling
├── config.js           # Frontend configuration
├── script.js           # Main frontend logic
├── web3-wallet.js      # Web3 wallet integration
├── worker-backend/     # Cloudflare Worker backend
│   ├── index.js        # Main worker code
│   ├── package.json    # Worker dependencies
│   ├── wrangler.toml   # Worker configuration
│   ├── README.md       # Worker documentation
│   ├── test-worker.js  # Worker test scripts
│   └── Makefile        # Development commands
├── DEPLOYMENT-GUIDE.md # Deployment instructions
├── ARCHITECTURE.md     # System architecture
├── deploy.sh           # Deployment script (Linux/Mac)
└── deploy.bat          # Deployment script (Windows)
```

## Features

- **Fast & Secure Exchange**: Instant cross-chain cryptocurrency swaps
- **Anonymous Trading**: No account required
- **Responsive Design**: Works on all devices
- **Web3 Wallet Integration**: Connect popular crypto wallets
- **Real-time Payment Tracking**: Live payment status updates
- **Multi-Currency Support**: BTC, ETH, TRX, BNB and more

## Technology Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Cloudflare Workers (Serverless)
- **Hosting**: Cloudflare Pages
- **API**: Custom REST API
- **Storage**: Cloudflare KV/D1 (planned)

## How It Works

1. **User Exchange Request**:
   - User visits the main page and fills out the exchange form
   - Selects cryptocurrency to send and receive method
   - Enters amount and receiving wallet address

2. **Order Creation**:
   - Frontend sends request to Cloudflare Worker backend
   - Backend creates unique order with payment address
   - User is redirected to payment page with order ID

3. **Payment Processing**:
   - User sends cryptocurrency to the provided address
   - Payment page polls backend for status updates
   - Backend monitors for payment confirmation

4. **Order Completion**:
   - Once payment is confirmed, order status updates
   - User receives their exchanged cryptocurrency
   - Webhook notifications are sent for tracking

## Configuration

### Frontend Configuration

Edit `config.js` to set your backend URL:
```javascript
window.CONFIG = {
  WORKER_URL: 'https://api.onncx.com'  // Your Cloudflare Worker URL
};
```

### Backend Configuration

Edit `worker-backend/wrangler.toml` to configure:
- API keys
- Webhook URLs
- Database connections

## Deployment

### Prerequisites

1. Cloudflare account
2. Custom domain (onncx.com)
3. Node.js and npm installed
4. Wrangler CLI (`npm install -g wrangler`)

### Deploy Frontend

Deploy to Cloudflare Pages through the dashboard:
1. Upload all HTML, CSS, and JS files
2. Set custom domain to `onncx.com`

### Deploy Backend

Deploy the Cloudflare Worker:
```bash
cd worker-backend
npm install
npm run deploy
```

Then configure the route `api.onncx.com/*` to point to your worker.

### Automated Deployment

Use the provided scripts:
- Linux/Mac: `./deploy.sh`
- Windows: `deploy.bat`

## API Endpoints

### Health Check
```
GET https://api.onncx.com/health
```

### Create Order
```
POST https://api.onncx.com/api/order
```

### Get Order
```
GET https://api.onncx.com/api/order/{order_id}
```

### Update Order Status
```
PUT https://api.onncx.com/api/order/{order_id}
```

## Development

### Local Development

1. Install dependencies:
   ```bash
   cd worker-backend
   npm install
   ```

2. Run worker locally:
   ```bash
   npm run dev
   ```

3. Test endpoints:
   ```bash
   node test-worker.js
   ```

### Project Commands

Using Makefile (Linux/Mac):
```bash
cd worker-backend
make help      # Show available commands
make install   # Install dependencies
make dev       # Run locally
make deploy    # Deploy to Cloudflare
make test      # Run tests
```

## Production Considerations

1. **Data Storage**: Implement Cloudflare KV or D1 for persistent storage
2. **Security**: Add authentication and rate limiting
3. **Monitoring**: Set up Cloudflare Analytics and error tracking
4. **Performance**: Enable caching and optimize assets

## Support

For issues with deployment or customization:
1. Check the [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
2. Review the [ARCHITECTURE.md](ARCHITECTURE.md) documentation
3. Examine worker logs in the Cloudflare dashboard

## License

This project is provided as-is for educational and demonstration purposes.