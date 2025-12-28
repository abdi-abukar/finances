# OAuth Banks Setup (RBC, TD, etc.)

## The Problem

You're getting **EXIT** events when selecting **RBC** or other Canadian OAuth banks because:

1. **OAuth banks require HTTPS redirect URIs**
2. Your local development is on `http://localhost:3000` (not HTTPS)
3. Plaid **rejects** HTTP redirect URIs for security reasons

## The Solution: Use ngrok for Local HTTPS

### Option 1: Quick Setup with ngrok (Recommended)

#### Step 1: Install ngrok

```bash
# Using Homebrew (Mac)
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start ngrok tunnel

```bash
# In a new terminal window
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

#### Step 3: Update your .env file

Copy the **https** URL from ngrok and add to your `.env`:

```env
PLAID_REDIRECT_URI=https://abc123.ngrok.io/oauth-redirect
```

**Important:** Replace `abc123.ngrok.io` with YOUR actual ngrok URL!

#### Step 4: Restart your dev server

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

#### Step 5: Test with RBC

1. Go to `https://abc123.ngrok.io/test-plaid` (use the ngrok URL, not localhost)
2. Click "Connect Bank Account"
3. Search for "RBC" or "Royal Bank"
4. Enter your real RBC credentials
5. Complete the OAuth flow

---

### Option 2: Deploy to Vercel/Netlify (For Persistent Testing)

If you don't want to use ngrok every time:

1. Deploy your app to Vercel or Netlify
2. Get your production URL (e.g., `https://your-app.vercel.app`)
3. Update `.env` with:
   ```env
   PLAID_REDIRECT_URI=https://your-app.vercel.app/oauth-redirect
   ```

---

## Why RBC Requires OAuth

**OAuth banks** (like RBC, TD, Scotiabank in Canada) use a different authentication flow:

1. User clicks "Connect RBC"
2. Plaid redirects to RBC's website
3. User logs in on RBC's actual website
4. RBC redirects back to your app via `redirect_uri`
5. Plaid completes the connection

**Without HTTPS redirect URI**, step 4 fails and Plaid exits immediately.

---

## Which Banks Require OAuth?

### 🇨🇦 Canada (Most require OAuth)
- ✅ RBC (Royal Bank of Canada)
- ✅ TD Canada Trust
- ✅ Scotiabank
- ✅ BMO (Bank of Montreal)
- ✅ CIBC

### 🇺🇸 United States (Some require OAuth)
- ✅ Chase (requires full Production + OAuth approval)
- ✅ Bank of America (requires full Production + OAuth approval)
- ✅ Wells Fargo (requires full Production + OAuth approval)
- ❌ Most smaller banks use username/password (no OAuth)

---

## Troubleshooting

### "Invalid redirect_uri" error

**Problem:** Your redirect URI doesn't match what's configured in Plaid Dashboard.

**Solution:**
1. Go to [Plaid Dashboard → API Settings](https://dashboard.plaid.com/team/api)
2. Add your ngrok URL to "Allowed redirect URIs"
3. Format: `https://abc123.ngrok.io/oauth-redirect`

### ngrok URL keeps changing

**Problem:** Free ngrok URLs change every time you restart ngrok.

**Solutions:**
- **Upgrade to ngrok Pro** for a static domain
- **Or use Vercel/Netlify** for a permanent HTTPS URL
- **Or use ngrok with a custom domain** (requires paid plan)

### Still getting EXIT events

**Check these:**
1. ✅ Using the **ngrok HTTPS URL** (not localhost)
2. ✅ Added redirect URI to `.env` file
3. ✅ Restarted dev server after updating `.env`
4. ✅ Using **production** Plaid secret (not sandbox)
5. ✅ Completed Plaid Dashboard profile (Application + Company info)

---

## Quick Reference

### Your .env file should have:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_production_secret
PLAID_ENV=production
NEXT_PUBLIC_PLAID_ENV=production

# OAuth Redirect (use your ngrok URL)
PLAID_REDIRECT_URI=https://your-ngrok-url.ngrok.io/oauth-redirect
```

### Testing checklist:

- [ ] ngrok is running (`ngrok http 3000`)
- [ ] `.env` has `PLAID_REDIRECT_URI` with ngrok URL
- [ ] Dev server restarted after `.env` changes
- [ ] Accessing app via ngrok URL (not localhost)
- [ ] Using real bank credentials (not test credentials)

---

## Alternative: Test with Non-OAuth Banks

If you don't want to set up ngrok, test with banks that **don't** require OAuth:

### 🇨🇦 Canada - Non-OAuth Banks
- Tangerine
- EQ Bank
- Some credit unions

### 🇺🇸 United States - Non-OAuth Banks
- Most credit unions
- Regional banks
- Fintech apps (Chime, etc.)

These banks use simple username/password authentication and work fine on localhost HTTP.

---

## Need Help?

1. Check browser console for error messages
2. Check terminal logs for Plaid warnings
3. Review [setup-ngrok.md](./setup-ngrok.md) for detailed ngrok instructions
4. See [LIMITED_PRODUCTION_TROUBLESHOOTING.md](./LIMITED_PRODUCTION_TROUBLESHOOTING.md) for general Plaid issues
