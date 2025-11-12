#!/bin/bash

# ONE⚡CASH Deployment Script

echo "🚀 Starting ONE⚡CASH deployment process..."

# Check if we're in the correct directory
if [ ! -f "index.html" ]; then
  echo "❌ Error: index.html not found. Please run this script from the root directory."
  exit 1
fi

echo "✅ Found project files"

# Deploy frontend to Cloudflare Pages
echo "🌐 Deploying frontend to Cloudflare Pages..."
# This would typically be done through the Cloudflare dashboard or CLI
# For now, we'll just show the instructions
echo "   Please deploy the following files to Cloudflare Pages:"
echo "   - All HTML files (index.html, payment.html, etc.)"
echo "   - style.css"
echo "   - config.js"
echo "   - script.js"
echo "   - web3-wallet.js"

# Deploy backend to Cloudflare Workers
echo "⚙️  Deploying backend to Cloudflare Workers..."
cd worker-backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Deploy the worker
echo "📤 Deploying worker..."
npm run deploy

echo "✅ Backend deployment completed!"

# Return to root directory
cd ..

echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. Configure your custom domain (onncx.com) in Cloudflare Pages"
echo "2. Configure your API subdomain (api.onncx.com) to point to your worker"
echo "3. Test the integration by visiting your deployed site"
echo "4. Monitor the worker logs in the Cloudflare dashboard"