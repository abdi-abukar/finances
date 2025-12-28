import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

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

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE LINK TOKEN REQUEST ===');
    console.log('Plaid Environment:', process.env.PLAID_ENV);
    console.log('Client ID:', process.env.PLAID_CLIENT_ID);
    console.log('Secret exists:', !!process.env.PLAID_SECRET);

    const { userId } = await request.json();
    console.log('User ID:', userId);

    const linkTokenConfig: any = {
      user: {
        client_user_id: userId || 'user-id',
      },
      client_name: 'Personal Finance Tracker',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.Ca],
      language: 'en',
      // Optional: Add webhook for real-time updates
      // webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
    };

    // Add redirect URI for OAuth banks (required for some banks like RBC)
    // Note: Plaid requires HTTPS for redirect URIs, even in development
    // Determine the redirect URI
    let redirectUri = process.env.PLAID_REDIRECT_URI;

    // If no explicit redirect URI is set, try to infer it from Vercel environment variables
    if (!redirectUri) {
      // VERCEL_PROJECT_PRODUCTION_URL is the production domain (e.g., my-app.vercel.app)
      // VERCEL_URL is the current deployment domain (e.g., my-app-git-main.vercel.app or my-app.vercel.app)
      const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
      
      if (vercelUrl) {
        // Vercel URLs don't include protocol, so we add https://
        redirectUri = `https://${vercelUrl}/oauth-callback`;
        console.log('Inferred redirect URI from Vercel env:', redirectUri);
      }
    }

    // Add redirect URI to config if it exists and uses HTTPS
    if (redirectUri && redirectUri.startsWith('https://')) {
      linkTokenConfig.redirect_uri = redirectUri;
      console.log('Using redirect URI for OAuth:', redirectUri);
    } else if (redirectUri) {
      console.warn('⚠️ WARNING: redirect_uri must use HTTPS. Skipping redirect_uri:', redirectUri);
      console.warn('OAuth banks like RBC may not work without HTTPS redirect URI.');
    } else {
      console.warn('⚠️ WARNING: No redirect_uri configured. OAuth banks may fail.');
    }

    // Add link customization for development/production (required for Data Transparency Messaging)
    // if (process.env.PLAID_ENV !== 'sandbox') {
    //   if (process.env.PLAID_LINK_CUSTOMIZATION_NAME) {
    //     linkTokenConfig.link_customization_name = process.env.PLAID_LINK_CUSTOMIZATION_NAME;
    //     console.log('Using link customization:', process.env.PLAID_LINK_CUSTOMIZATION_NAME);
    //   } else {
    //     console.warn('⚠️ WARNING: PLAID_LINK_CUSTOMIZATION_NAME not set. This is required for development/production.');
    //     console.warn('Configure Data Transparency Messaging at: https://dashboard.plaid.com/link/customizations');
    //   }
    // }

    const response = await plaidClient.linkTokenCreate(linkTokenConfig);

    console.log('Link token created successfully');
    return NextResponse.json({
      link_token: response.data.link_token
    });
  } catch (error: any) {
    console.error('=== ERROR CREATING LINK TOKEN ===');
    console.error('Error message:', error.message);
    console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create link token',
        details: error.response?.data
      },
      { status: 500 }
    );
  }
}
