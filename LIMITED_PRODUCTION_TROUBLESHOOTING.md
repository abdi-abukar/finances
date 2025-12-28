# Plaid Limited Production Troubleshooting Guide

## What is Limited Production?

**Limited Production** is Plaid's free tier that lets you test with **real live bank data** (not sandbox test data). It replaced the old "Development" environment.

### Key Differences from Sandbox:
- ✅ Uses **real financial data** from actual bank accounts
- ✅ **Free** to use (with API call limits)
- ❌ **Major banks are blocked** (Chase, Bank of America, Wells Fargo, etc.)
- ❌ Requires **production API keys** (not sandbox keys)

---

## Common Issues & Solutions

### 🔴 Issue #1: Major Banks Don't Work

**Problem:** You can't connect to Chase, Bank of America, Wells Fargo, or other major institutions.

**Why:** These banks require **full Production access** with OAuth approval. They're intentionally blocked in Limited Production.

**Solution:**
- Use **smaller regional banks** or credit unions for testing
- Or request **full Production access** from Plaid (requires review process)

**Institutions that typically work in Limited Production:**
- Smaller credit unions
- Regional banks
- Some fintech apps (Chime, etc.)

---

### 🔴 Issue #2: Wrong Environment Configuration

**Problem:** Getting authentication errors or "invalid credentials" errors.

**Current Setup Required:**

```env
# .env file
PLAID_ENV=production          # NOT "sandbox" or "development"
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_PRODUCTION_secret   # NOT your sandbox secret!
```

**How to Get Your Production Secret:**
1. Go to [Plaid Dashboard → Keys](https://dashboard.plaid.com/team/keys)
2. Look for **"production"** secret (different from sandbox)
3. Copy and use that in your `.env` file

---

### 🔴 Issue #3: API Rate Limits Exceeded

**Problem:** Getting `RATE_LIMIT_EXCEEDED` errors.

**Why:** Limited Production has caps on API calls per product:
- Both successful AND failed calls count toward the limit
- Limits vary by product (Auth, Transactions, etc.)

**Solution:**
- Check your [Plaid Dashboard](https://dashboard.plaid.com) for usage stats
- If you've hit limits, you need to:
  - Wait for the limit to reset
  - Or upgrade to full Production access

---

### 🔴 Issue #4: Missing Dashboard Configuration

**Problem:** OAuth banks fail or certain institutions don't appear.

**Required Setup in Plaid Dashboard:**

1. **Complete Application Profile:**
   - Go to [Team Settings → Application](https://dashboard.plaid.com/team/application)
   - Fill out all required fields

2. **Complete Company Profile:**
   - Go to [Team Settings → Company](https://dashboard.plaid.com/team/company)
   - Provide company information

3. **Security Questionnaire (for OAuth):**
   - Required for US OAuth-based institutions
   - Complete at [Team Settings → Security](https://dashboard.plaid.com/team/security)

4. **Enable Countries:**
   - Go to [Account → Allowed Countries](https://dashboard.plaid.com/account/countries)
   - Enable US, Canada, or other countries you need

---

### 🔴 Issue #5: Still Using Sandbox Test Credentials

**Problem:** Trying to use `user_good` / `pass_good` in Limited Production.

**Why:** Those are **Sandbox-only** test credentials. Limited Production requires **real bank credentials**.

**Solution:**
- Use your **actual bank login credentials**
- Make sure you're testing with a bank that's available in Limited Production (not a major bank)

---

### 🔴 Issue #6: OAuth Banks Exit Immediately (RBC, TD, etc.)

**Problem:** When you select RBC, TD, or other Canadian banks, Plaid Link exits immediately with no error message.

**Why:** These are **OAuth banks** that require:
- HTTPS redirect URI (you're on `http://localhost`)
- Plaid rejects HTTP redirect URIs for security reasons

**Solution:**

**For local development with OAuth banks:**
1. Install ngrok: `brew install ngrok`
2. Start tunnel: `ngrok http 3000`
3. Add to `.env`: `PLAID_REDIRECT_URI=https://your-ngrok-url.ngrok.io/oauth-redirect`
4. Restart dev server
5. Access app via the ngrok HTTPS URL (not localhost)

**See detailed setup guide:** [OAUTH_BANKS_SETUP.md](./OAUTH_BANKS_SETUP.md)

**Alternative:** Test with non-OAuth banks (Tangerine, EQ Bank, US credit unions) that work on localhost

---

## Step-by-Step Setup Checklist

### ✅ Step 1: Verify Your Plaid Dashboard Setup

- [ ] Requested "Limited Production" access (look for "Test with Real Data" option)
- [ ] Completed Application Profile
- [ ] Completed Company Profile
- [ ] Enabled countries (US, Canada, etc.)
- [ ] Noted your **production** secret key (not sandbox)

### ✅ Step 2: Update Environment Variables

```env
PLAID_ENV=production
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_production_secret_here  # From Dashboard → Keys → Production
NEXT_PUBLIC_PLAID_ENV=production
```

### ✅ Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### ✅ Step 4: Test with a Supported Bank

**DO NOT test with:**
- ❌ Chase
- ❌ Bank of America  
- ❌ Wells Fargo
- ❌ Citi
- ❌ Capital One

**DO test with:**
- ✅ Local credit unions
- ✅ Smaller regional banks
- ✅ Fintech apps (Chime, etc.)
- ✅ Any bank that appears in the Plaid Link modal

### ✅ Step 5: Use Real Credentials

- Use your **actual** bank username and password
- NOT `user_good` / `pass_good` (those are sandbox-only)

---

## How to Check What's Wrong

### 1. Check Server Logs

Your code already has excellent logging. Look for these in your terminal:

```
=== CREATE LINK TOKEN REQUEST ===
Plaid Environment: production
Client ID: [your_client_id]
Secret exists: true
```

### 2. Check for Warnings

Look for these specific warnings:
- `⚠️ WARNING: PLAID_LINK_CUSTOMIZATION_NAME not set`
- `⚠️ WARNING: redirect_uri must use HTTPS`

### 3. Check Browser Console

Open browser DevTools (F12) and look for:
- Network errors (400, 401, 403, 500)
- Plaid-specific error messages

### 4. Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `INVALID_CREDENTIALS` | Wrong API keys | Use production secret, not sandbox |
| `RATE_LIMIT_EXCEEDED` | Hit API call limit | Wait or upgrade to Production |
| `INSTITUTION_NOT_AVAILABLE` | Bank not supported | Try a different bank (not a major one) |
| `OAUTH_REQUIRED` | Bank needs OAuth | Complete security questionnaire or upgrade |

---

## Testing Flow for Limited Production

1. **Navigate to:** `http://localhost:3000/test-plaid`
2. **Click:** "Connect Bank Account"
3. **Search for:** A smaller bank or credit union (NOT Chase, BofA, etc.)
4. **Enter:** Your **real** credentials for that bank
5. **Authorize:** The connection
6. **Fetch:** Transactions (should show real data)

---

## When to Upgrade to Full Production

You need **full Production access** if you want to:
- Connect to major banks (Chase, BofA, Wells Fargo, etc.)
- Remove API call limits
- Deploy to real users
- Access OAuth-based institutions

**How to Request:**
1. Go to [Plaid Dashboard](https://dashboard.plaid.com)
2. Look for "Request Production Access"
3. Fill out the application (can take days/weeks for approval)

---

## Still Not Working?

### Debug Checklist:

1. **Verify environment:**
   ```bash
   # In your terminal where dev server is running
   echo $PLAID_ENV  # Should output: production
   ```

2. **Check your .env file:**
   - Make sure it's named `.env` or `.env.local` (not `.env.txt`)
   - Restart dev server after any changes

3. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/plaid/create-link-token \
     -H "Content-Type: application/json" \
     -d '{"userId": "test-user"}'
   ```

5. **Check Plaid Status:**
   - Visit [status.plaid.com](https://status.plaid.com) for any outages

---

## Resources

- [Plaid Environments Documentation](https://plaid.com/docs/api/tokens/#linktokencreate)
- [Limited Production Info](https://plaid.com/docs/account/activity/)
- [Plaid Dashboard](https://dashboard.plaid.com)
- [Plaid Status Page](https://status.plaid.com)

---

## Quick Reference: Environment Comparison

| Feature | Sandbox | Limited Production | Full Production |
|---------|---------|-------------------|-----------------|
| **Data Type** | Fake test data | Real live data | Real live data |
| **Cost** | Free | Free (with limits) | Paid per API call |
| **Test Credentials** | `user_good`/`pass_good` | Real credentials | Real credentials |
| **Major Banks** | ✅ All available | ❌ Blocked | ✅ All available |
| **API Limits** | Unlimited | Capped per product | Based on plan |
| **OAuth Banks** | Limited | Requires questionnaire | Full access |
| **Best For** | Initial development | Testing with real data | Production apps |
