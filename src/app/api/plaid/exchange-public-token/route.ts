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

// Helper to store access tokens (in production, use a database)
const storeAccessToken = (itemId: string, accessToken: string, accountId?: string) => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'plaid-tokens.json');
    let tokens: any = {};

    if (fs.existsSync(filePath)) {
      tokens = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    tokens[itemId] = {
      accessToken,
      accountId,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error storing access token:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { public_token, accountId } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: 'public_token is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = response.data;

    // Store the access token (in production, save to database)
    storeAccessToken(item_id, access_token, accountId);

    return NextResponse.json({
      success: true,
      item_id,
      message: 'Successfully linked bank account'
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to exchange public token',
        details: error.response?.data
      },
      { status: 500 }
    );
  }
}
