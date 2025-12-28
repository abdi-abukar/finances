# Setting Up HTTPS for OAuth Banks (RBC)

## Why HTTPS is Required
Plaid requires HTTPS redirect URIs for OAuth banks, even in development mode. RBC is an OAuth bank, so you need an HTTPS URL.

## Option 1: Use ngrok (Recommended for Local Development)

### Step 1: Install ngrok
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### Step 2: Start Your Next.js App
```bash
npm run dev
# App should be running on http://localhost:3000
```

### Step 3: Start ngrok Tunnel
```bash
# In a new terminal
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Update .env with ngrok URL
Copy the `https://` URL from ngrok and update your `.env`:
```env
PLAID_REDIRECT_URI=https://abc123.ngrok.io/oauth-callback
```

### Step 5: Register in Plaid Dashboard
1. Go to https://dashboard.plaid.com/team/api
2. Find "Allowed redirect URIs"
3. Add your ngrok URL: `https://abc123.ngrok.io/oauth-callback`
4. Save

### Step 6: Restart Dev Server
```bash
# Stop and restart
npm run dev
```

### Step 7: Test with RBC
1. Open your ngrok URL: `https://abc123.ngrok.io/test-plaid`
2. Click "Connect Bank Account"
3. Search for "RBC"
4. Enter your real credentials
5. Complete OAuth flow

## Option 2: Test with Non-OAuth Banks First

If you don't want to set up ngrok right now, you can test with non-OAuth banks:

1. Keep `PLAID_REDIRECT_URI` commented out in `.env`
2. Try connecting to banks like:
   - Chase
   - Bank of America
   - Wells Fargo
   - Capital One

These banks use traditional login (username/password) instead of OAuth.

## Option 3: Deploy to Production

Deploy your app to a hosting service with HTTPS:
- Vercel: https://vercel.com
- Netlify: https://netlify.com
- Railway: https://railway.app

Then use your production URL as the redirect URI.

## Important Notes

- **ngrok URLs change on free tier**: Each time you restart ngrok, you get a new URL. You'll need to update `.env` and Plaid Dashboard each time.
- **ngrok paid tier**: Gets you a static subdomain that doesn't change
- **For production**: Use your actual domain with HTTPS

## Troubleshooting

### ngrok not found
```bash
# Make sure it's installed
brew install ngrok

# Or add to PATH if downloaded manually
export PATH=$PATH:/path/to/ngrok
```

### Port already in use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### ngrok session expired
Free ngrok sessions expire after a few hours. Just restart ngrok to get a new session.
