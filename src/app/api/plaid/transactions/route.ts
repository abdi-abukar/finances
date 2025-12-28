import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import fs from 'fs';
import path from 'path';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Helper to get access token (in production, use a database)
const getAccessToken = (itemId: string): string | null => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'plaid-tokens.json');

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const tokens = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return tokens[itemId]?.accessToken || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

// Helper to get all access tokens
const getAllAccessTokens = (): Array<{ itemId: string; accessToken: string; accountId?: string }> => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'plaid-tokens.json');

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const tokens = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Object.entries(tokens).map(([itemId, data]: [string, any]) => ({
      itemId,
      accessToken: data.accessToken,
      accountId: data.accountId
    }));
  } catch (error) {
    console.error('Error getting all access tokens:', error);
    return [];
  }
};

export async function POST(request: NextRequest) {
  try {
    const { item_id, start_date, end_date } = await request.json();

    // If no itemId provided, fetch from all linked accounts
    const tokensToFetch = item_id
      ? [{ itemId: item_id, accessToken: getAccessToken(item_id), accountId: undefined }]
      : getAllAccessTokens();

    if (tokensToFetch.length === 0 || !tokensToFetch[0].accessToken) {
      return NextResponse.json(
        { error: 'No linked bank accounts found. Please link a bank account first.' },
        { status: 404 }
      );
    }

    const allTransactions: any[] = [];
    const errors: any[] = [];

    // Fetch transactions from all linked accounts
    for (const { itemId, accessToken, accountId } of tokensToFetch) {
      if (!accessToken) continue;

      try {
        // Default to last 30 days if no date range provided
        const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];

        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
        });

        const { transactions, accounts } = response.data;

        // Transform transactions to match your app's format
        const transformedTransactions = transactions.map(transaction => ({
          id: transaction.transaction_id,
          accountId: accountId || transaction.account_id,
          accountName: accounts.find(acc => acc.account_id === transaction.account_id)?.name || 'Unknown',
          date: transaction.date,
          description: transaction.name,
          amount: transaction.amount, // Plaid uses positive for expenses, negative for income
          category: transaction.category?.join(' > ') || 'Uncategorized',
          pending: transaction.pending,
          merchant_name: transaction.merchant_name,
          plaid_transaction_id: transaction.transaction_id,
          plaid_item_id: itemId,
          source: 'plaid'
        }));

        allTransactions.push(...transformedTransactions);
      } catch (error: any) {
        console.error(`Error fetching transactions for item ${itemId}:`, error);
        errors.push({
          itemId,
          error: error.message || 'Failed to fetch transactions'
        });
      }
    }

    return NextResponse.json({
      success: true,
      transactions: allTransactions,
      count: allTransactions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch transactions',
        details: error.response?.data
      },
      { status: 500 }
    );
  }
}
