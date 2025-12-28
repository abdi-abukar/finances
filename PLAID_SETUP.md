# Plaid Integration Setup Guide

This guide will help you set up Plaid integration for real-time transaction imports.

## Overview

Your personal finance tracker now supports importing transactions directly from bank accounts using Plaid's API. This eliminates the need to manually upload statements and use AI extraction.

## What's Been Set Up

### 1. API Routes
- **[/api/plaid/create-link-token/route.ts](src/app/api/plaid/create-link-token/route.ts)** - Creates a link token for Plaid Link
- **[/api/plaid/exchange-public-token/route.ts](src/app/api/plaid/exchange-public-token/route.ts)** - Exchanges public token for access token
- **[/api/plaid/transactions/route.ts](src/app/api/plaid/transactions/route.ts)** - Fetches transactions from connected accounts

### 2. React Components
- **[/src/components/plaid/PlaidLink.tsx](src/components/plaid/PlaidLink.tsx)** - Plaid Link UI component

### 3. Test Page
- **[/src/app/test-plaid/page.tsx](src/app/test-plaid/page.tsx)** - Test page at `/test-plaid` route

## Setup Instructions

### Step 1: Get Plaid API Credentials

1. Go to [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. Create a free account (Sandbox is free forever)
3. Navigate to **Team Settings → Keys**
4. Copy your:
   - `client_id`
   - `sandbox` secret key

### Step 2: Update Environment Variables

Open your [.env.local](.env.local) file and replace the placeholders:

```env
PLAID_CLIENT_ID=your_actual_client_id_here
PLAID_SECRET=your_actual_sandbox_secret_here
PLAID_ENV=sandbox
NEXT_PUBLIC_PLAID_ENV=sandbox
```

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Test the Integration

1. Navigate to [http://localhost:3000/test-plaid](http://localhost:3000/test-plaid)
2. Click "Connect Bank Account"
3. Select any bank from the list
4. Use Plaid Sandbox test credentials:
   - Username: `user_good`
   - Password: `pass_good`
5. Click "Fetch Transactions" to import transactions

## Sandbox Test Credentials

### Success Case
- Username: `user_good`
- Password: `pass_good`

### Invalid Credentials (to test error handling)
- Username: `user_bad`
- Password: `pass_bad`

More test credentials: [https://plaid.com/docs/sandbox/test-credentials/](https://plaid.com/docs/sandbox/test-credentials/)

## How It Works

1. **Link Token Creation**: When the PlaidLink component mounts, it requests a link token from your API
2. **Plaid Link Modal**: User clicks "Connect Bank Account" and sees Plaid's UI
3. **Bank Selection & Login**: User selects their bank and logs in with their credentials
4. **Token Exchange**: After successful authentication, the public token is exchanged for an access token (stored in `data/plaid-tokens.json`)
5. **Fetch Transactions**: Using the access token, transactions are fetched from Plaid API

## Production Considerations

### Security
- **Access Tokens**: Currently stored in a local JSON file. In production, store them in a secure database with encryption
- **User Authentication**: Add proper user authentication before allowing bank connections
- **Webhook Setup**: Configure webhooks for real-time transaction updates

### Moving to Production

1. **Request Production Access** from Plaid (requires review)
2. **Update Environment Variables**:
   ```env
   PLAID_ENV=production
   PLAID_SECRET=your_production_secret
   ```
3. **Set up a Database**: Replace the JSON file storage with a proper database
4. **Configure Webhooks**: For real-time transaction updates
5. **Add Error Handling**: Implement proper error handling and retry logic

## Integration with Your App

To add the PlaidLink component to your existing dashboard:

```tsx
import PlaidLink from '@/components/plaid/PlaidLink';

// In your component
<PlaidLink
  userId={selectedProfile.id}
  accountId={selectedAccount?.id}
  onSuccess={(transactions) => {
    // Handle fetched transactions
    console.log('Fetched transactions:', transactions);
  }}
  onError={(error) => {
    // Handle errors
    console.error('Plaid error:', error);
  }}
/>
```

## API Endpoints

### Create Link Token
```bash
POST /api/plaid/create-link-token
Body: { "userId": "user-123" }
```

### Exchange Public Token
```bash
POST /api/plaid/exchange-public-token
Body: { "public_token": "public-sandbox-...", "accountId": "acc-123" }
```

### Fetch Transactions
```bash
POST /api/plaid/transactions
Body: {
  "item_id": "item-123",  // optional, fetches from all accounts if not provided
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

## Transaction Format

Transactions fetched from Plaid are transformed to match your app's format:

```typescript
{
  id: string;              // Plaid transaction ID
  accountId: string;       // Your app's account ID
  accountName: string;     // Account name from Plaid
  date: string;            // YYYY-MM-DD
  description: string;     // Transaction name
  amount: number;          // Positive for expenses, negative for income
  category: string;        // Category from Plaid
  pending: boolean;        // Whether transaction is pending
  merchant_name: string;   // Merchant name if available
  source: 'plaid';        // Source identifier
}
```

## Troubleshooting

### "Failed to create link token"
- Verify your `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct
- Make sure you've restarted the dev server after updating `.env.local`
- Check that `PLAID_ENV=sandbox`

### "No linked bank accounts found"
- You need to complete the bank linking flow first
- Check if `data/plaid-tokens.json` was created

### "Invalid credentials"
- Make sure you're using the correct Sandbox test credentials
- Try `user_good` / `pass_good`

## Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Quickstart](https://plaid.com/docs/quickstart/)
- [Plaid Sandbox Guide](https://plaid.com/docs/sandbox/)
- [React Plaid Link](https://github.com/plaid/react-plaid-link)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all environment variables are set correctly
4. Ensure the dev server was restarted after updating `.env.local`
