'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

interface PlaidLinkProps {
  userId?: string;
  accountId?: string;
  onSuccess?: (transactions: any[]) => void;
  onError?: (error: any) => void;
}

export default function PlaidLink({
  userId = 'user-1',
  accountId,
  onSuccess,
  onError
}: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);

  // Create link token on component mount
  useEffect(() => {
    createLinkToken();
  }, [userId]);

  const createLinkToken = async () => {
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.link_token) {
        setLinkToken(data.link_token);
        setError(null);
      } else {
        setError(data.error || 'Failed to create link token');
      }
    } catch (err: any) {
      console.error('Error creating link token:', err);
      setError(err.message || 'Failed to initialize Plaid Link');
      if (onError) onError(err);
    }
  };

  const onExitCallback = useCallback((err: any, metadata: any) => {
    console.log('=== PLAID LINK EXIT ===');
    console.log('Error:', err);
    console.log('Metadata:', metadata);

    if (err) {
      // User encountered an error
      const errorMessage = err.error_message || err.display_message || 'An error occurred';

      // Check for OAuth-specific errors
      if (err.error_code === 'OAUTH_STATE_ID_ALREADY_PROCESSED' ||
        metadata?.institution?.name?.toLowerCase().includes('rbc') ||
        metadata?.institution?.name?.toLowerCase().includes('royal bank')) {
        setError(
          `⚠️ OAuth Bank Detected: ${metadata?.institution?.name || 'This bank'} requires HTTPS redirect URI. ` +
          'For local testing, you need to use ngrok or deploy to a staging environment with HTTPS. ' +
          'See LIMITED_PRODUCTION_TROUBLESHOOTING.md for setup instructions.'
        );
      } else {
        setError(errorMessage);
      }

      if (onError) onError(err);
    } else if (metadata?.status === 'requires_questions' ||
      metadata?.status === 'requires_selections' ||
      metadata?.status === 'requires_code') {
      // User needs to complete additional steps
      console.log('Additional steps required:', metadata.status);
    } else {
      // User exited without error (closed the modal)
      console.log('User closed Plaid Link');
    }
  }, [onError]);

  const onSuccessCallback = useCallback(async (public_token: string, metadata: any) => {
    setIsLinking(true);
    try {
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token,
          accountId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLinked(true);
        setItemId(data.item_id);
        setError(null);

        // Automatically fetch transactions after linking
        await fetchTransactions(data.item_id);
      } else {
        setError(data.error || 'Failed to link account');
        if (onError) onError(new Error(data.error));
      }
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      setError(err.message || 'Failed to complete account linking');
      if (onError) onError(err);
    } finally {
      setIsLinking(false);
    }
  }, [accountId, onError]);

  const fetchTransactions = async (item_id?: string) => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: item_id || itemId,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setError(null);
        if (onSuccess) onSuccess(data.transactions);
      } else {
        setError(data.error || 'Failed to fetch transactions');
        if (onError) onError(new Error(data.error));
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      if (onError) onError(err);
    } finally {
      setIsFetching(false);
    }
  };

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: onExitCallback,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            Connect Your Bank Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <Button
                  onClick={createLinkToken}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLinked ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Securely connect your bank account to automatically import transactions in real-time.
                  Your credentials are never stored on our servers.
                </p>
              </div>

              <Button
                onClick={() => open()}
                disabled={!ready || isLinking}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
                size="lg"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 mr-2" />
                    Connect Bank Account
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Powered by Plaid - Bank-level security with 256-bit encryption
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Bank Account Connected</p>
                  <p className="text-xs text-green-700">Successfully linked to Plaid</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fetchTransactions()}
                  disabled={isFetching}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Fetch Transactions
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => open()}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Recent Transactions ({transactions.length})
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-700">
                Last 30 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.slice(0, 20).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                      {transaction.pending && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 text-right">
                    <p
                      className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                    >
                      {transaction.amount > 0 ? '-' : '+'}$
                      {Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length > 20 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  +{transactions.length - 20} more transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
