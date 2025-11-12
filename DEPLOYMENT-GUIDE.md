# ONE⚡CASH Deployment Guide

This guide explains how to deploy your cryptocurrency exchange platform using Cloudflare Pages for the frontend and Cloudflare Workers for the backend.

## Prerequisites

1. A Cloudflare account
2. A custom domain (onncx.com)
3. Node.js and npm installed locally
4. Wrangler CLI installed (`npm install -g wrangler`)

## Frontend Deployment (Cloudflare Pages)

### 1. Prepare Your Files

Ensure all your frontend files are in the root directory:
- index.html
- payment.html
- faq.html
- privacy.html
- support.html
- terms.html
- style.css
- config.js
- script.js
- web3-wallet.js

### 2. Deploy to Cloudflare Pages

1. Log in to your Cloudflare dashboard
2. Navigate to "Workers & Pages" > "Create application"
3. Select "Pages" > "Connect to Git" or "Upload assets"
4. If using Git:
   - Connect your Git repository
   - Set the build settings:
     - Framework preset: None
     - Build command: (leave empty)
     - Build output directory: /
5. If uploading assets:
   - Select all your HTML, CSS, and JS files
   - Set the production branch to `main` or `master`

### 3. Configure Custom Domain

1. In your Pages project settings, go to "Custom domains"
2. Add your domain: `onncx.com`
3. Follow Cloudflare's instructions to update your DNS records

## Backend Deployment (Cloudflare Worker)

### 1. Navigate to Worker Directory

```bash
cd worker-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Locally (Optional)

```bash
npm run dev
```

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

### 5. Configure Custom Domain for Worker

1. In your Cloudflare dashboard, go to "Workers & Pages"
2. Select your deployed worker
3. Go to "Settings" > "Routes"
4. Add a route: `api.onncx.com/*`
5. Set the handler to your worker

## Configuration

### Frontend Configuration

Update `config.js` with your worker URL:
```javascript
window.CONFIG = {
  WORKER_URL: 'https://api.onncx.com'
};
```

### Backend Configuration

The worker uses these environment variables (configured in `wrangler.toml`):
- API_KEY: `CQVCKV8-N9ZM00R-J1R4F3H-3WW8D8N`
- WEBHOOK_URL: `https://hook.eu2.make.com/3DGENEqiuxGMmYaB35alKsswjYlnIhlF`

## Integration Points

### Frontend to Backend Communication

1. When a user submits the exchange form, the frontend makes a POST request to:
   `https://api.onncx.com/api/order`

2. The backend creates an order and returns an order ID

3. The frontend redirects to the payment page with the order ID:
   `payment.html?order_id=ORD1234567890`

4. The payment page polls the backend for order status:
   `https://api.onncx.com/api/order/ORD1234567890`

### Webhook Notifications

The backend sends notifications to your webhook URL for:
- Order creation
- Order status updates

## Production Considerations

1. **Data Storage**: The current implementation uses mock data. For production:
   - Uncomment and configure KV storage or D1 database in `wrangler.toml`
   - Update the worker code to use persistent storage

2. **Security**: 
   - Add authentication for sensitive endpoints
   - Implement rate limiting
   - Add input validation and sanitization

3. **Monitoring**:
   - Set up Cloudflare Analytics
   - Implement error tracking
   - Add health check endpoints

4. **Performance**:
   - Enable Cloudflare caching for static assets
   - Optimize images and assets
   - Use Cloudflare's CDN features

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your worker has proper CORS headers
2. **404 Errors**: Check your worker routes configuration
3. **Domain Issues**: Verify DNS records are correctly configured
4. **SSL/TLS**: Cloudflare automatically provides SSL certificates

### Debugging Steps

1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check Cloudflare Worker logs in the dashboard
4. Test API endpoints directly with tools like curl or Postman

## Support

For additional help with Cloudflare services, refer to:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)