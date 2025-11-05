# Exchange Frontend

This is the frontend for the crypto exchange application, designed to be deployed on Cloudflare Pages.

## Features

- Real-time exchange rate calculations
- Secure payment processing
- Responsive design
- Integration with NOWPayments API

## Deployment

This frontend is designed to be deployed on Cloudflare Pages:

1. Connect your GitHub repository to Cloudflare Pages
2. Set the build command to: `npm run build`
3. Set the build output directory to: `./` (root)
4. Add environment variables as needed:
   - `WORKER_URL`: Your backend worker URL

## Local Development

To run locally:

```bash
npm install
npm run dev
```

## Configuration

The application configuration is in [config.js](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/config.js):

- `WORKER_URL`: The URL of your backend Cloudflare Worker
- `CUSTOM_DOMAIN`: Your custom domain
- `API_KEY`: Your NOWPayments API key

## Files

- [index.html](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/index.html): Main page with exchange form
- [payment.html](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/payment.html): Payment processing page
- [script.js](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/script.js): Main JavaScript logic
- [style.css](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/style.css): Styling
- [config.js](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/config.js): Configuration settings

## Routes

The [_routes.json](file:///c:/Users/RATUL/OneDrive/Desktop/New%20folder%20(3)/cloudflare-frontend/_routes.json) file defines which paths are handled by Cloudflare Pages vs. your Worker:

- `/*`: All paths are handled by Pages
- `/api/*`: Excluded from Pages, handled by Worker
- `/webhook/*`: Excluded from Pages, handled by Worker