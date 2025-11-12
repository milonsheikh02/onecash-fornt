@echo off
REM ONE⚡CASH Deployment Script for Windows

echo 🚀 Starting ONE⚡CASH deployment process...

REM Check if we're in the correct directory
if not exist "index.html" (
  echo ❌ Error: index.html not found. Please run this script from the root directory.
  exit /b 1
)

echo ✅ Found project files

REM Deploy frontend to Cloudflare Pages
echo 🌐 Deploying frontend to Cloudflare Pages...
echo    Please deploy the following files to Cloudflare Pages:
echo    - All HTML files (index.html, payment.html, etc.)
echo    - style.css
echo    - config.js
echo    - script.js
echo    - web3-wallet.js

REM Deploy backend to Cloudflare Workers
echo ⚙️  Deploying backend to Cloudflare Workers...
cd worker-backend

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  npm install
)

REM Deploy the worker
echo 📤 Deploying worker...
npm run deploy

echo ✅ Backend deployment completed!

REM Return to root directory
cd ..

echo 🎉 Deployment process completed!
echo.
echo Next steps:
echo 1. Configure your custom domain (onncx.com) in Cloudflare Pages
echo 2. Configure your API subdomain (api.onncx.com) to point to your worker
echo 3. Test the integration by visiting your deployed site
echo 4. Monitor the worker logs in the Cloudflare dashboard