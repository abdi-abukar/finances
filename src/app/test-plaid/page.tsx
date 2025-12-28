'use client';

import { useState } from 'react';
import PlaidLink from '@/components/plaid/PlaidLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, TestTube } from 'lucide-react';

export default function TestPlaidPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (fetchedTransactions: any[]) => {
    setTransactions(fetchedTransactions);
    setError(null);
  };

  const handleError = (err: any) => {
    setError(err.message || 'An error occurred');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plaid Integration Test</h1>
              <p className="text-gray-600">Test your Plaid connection and fetch transactions</p>
            </div>
          </div>
        </div>

        {/* Environment Warning Banner */}
        {process.env.NEXT_PUBLIC_PLAID_ENV === 'production' && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Limited Production Mode Active</p>
                  <p className="text-sm text-purple-700 mt-1">
                    You're using <strong>real bank data</strong>. Major banks (Chase, Bank of America, Wells Fargo) are blocked.
                    Use smaller banks, credit unions, or fintech apps for testing.
                  </p>
                  <a
                    href="/LIMITED_PRODUCTION_TROUBLESHOOTING.md"
                    className="text-xs text-purple-600 underline mt-2 inline-block"
                  >
                    View troubleshooting guide →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        <Card className="border-0 shadow-lg bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-blue-900">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Get Your Plaid API Keys</p>
                  <p className="text-blue-700">
                    Sign up at{' '}
                    <a
                      href="https://dashboard.plaid.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      dashboard.plaid.com/signup
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Choose Your Environment</p>
                  <div className="mt-2 space-y-2 text-blue-700">
                    <div className="p-2 bg-blue-100 rounded">
                      <p className="font-semibold">🧪 Sandbox (Fake Data)</p>
                      <p className="text-xs">Use <code className="bg-white px-1 rounded">sandbox secret</code> from Team Settings → Keys</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded text-purple-700">
                      <p className="font-semibold">🚀 Limited Production (Real Data - Free)</p>
                      <p className="text-xs">Use <code className="bg-white px-1 rounded">production secret</code> from Team Settings → Keys</p>
                      <p className="text-xs mt-1">⚠️ Major banks (Chase, BofA) are blocked in Limited Production</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Update Your .env File</p>
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <p className="text-xs font-semibold mb-1">For Sandbox (Fake Data):</p>
                      <div className="font-mono text-xs space-y-0.5">
                        <p>PLAID_CLIENT_ID=your_client_id_here</p>
                        <p>PLAID_SECRET=your_sandbox_secret_here</p>
                        <p>PLAID_ENV=sandbox</p>
                        <p>NEXT_PUBLIC_PLAID_ENV=sandbox</p>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <p className="text-xs font-semibold mb-1 text-purple-900">For Limited Production (Real Data):</p>
                      <div className="font-mono text-xs space-y-0.5 text-purple-900">
                        <p>PLAID_CLIENT_ID=your_client_id_here</p>
                        <p className="font-bold">PLAID_SECRET=your_production_secret_here</p>
                        <p className="font-bold">PLAID_ENV=production</p>
                        <p className="font-bold">NEXT_PUBLIC_PLAID_ENV=production</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                  4
                </div>
                <div>
                  <p className="font-semibold">Restart Your Dev Server</p>
                  <div className="mt-2 p-3 bg-blue-100 rounded-lg font-mono text-xs">
                    <p>npm run dev</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                  5
                </div>
                <div className="w-full">
                  <p className="font-semibold">Test Your Connection</p>
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <p className="text-xs font-semibold mb-1">🧪 Sandbox Mode:</p>
                      <p className="text-xs text-blue-700 mb-2">Use these test credentials:</p>
                      <div className="font-mono text-xs space-y-1">
                        <p>Username: <strong>user_good</strong></p>
                        <p>Password: <strong>pass_good</strong></p>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <p className="text-xs font-semibold mb-1 text-purple-900">🚀 Limited Production Mode:</p>
                      <p className="text-xs text-purple-700 mb-2">Use your REAL bank credentials</p>
                      <p className="text-xs text-purple-700">⚠️ Avoid major banks (Chase, BofA, Wells Fargo) - they're blocked in Limited Production</p>
                      <p className="text-xs text-purple-700 mt-1">✅ Try: Local credit unions, regional banks, or fintech apps</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <Card className="border-0 shadow-lg bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {transactions.length > 0 && (
          <Card className="border-0 shadow-lg bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Success!</p>
                  <p className="text-sm text-green-700">
                    Successfully fetched {transactions.length} transactions from Plaid
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plaid Link Component */}
        <PlaidLink onSuccess={handleSuccess} onError={handleError} />

        {/* Environment Info */}
        <Card className="border-0 shadow-lg bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Environment Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plaid Environment</span>
              <Badge variant="outline" className="font-mono">
                {process.env.NEXT_PUBLIC_PLAID_ENV || 'Not Set'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge className={
                process.env.NEXT_PUBLIC_PLAID_ENV
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }>
                {process.env.NEXT_PUBLIC_PLAID_ENV ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sandbox Test Data */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Sandbox Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">Success Case:</p>
                <div className="font-mono text-xs space-y-1">
                  <p>Username: <code className="bg-white px-2 py-1 rounded">user_good</code></p>
                  <p>Password: <code className="bg-white px-2 py-1 rounded">pass_good</code></p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">Invalid Credentials:</p>
                <div className="font-mono text-xs space-y-1">
                  <p>Username: <code className="bg-white px-2 py-1 rounded">user_bad</code></p>
                  <p>Password: <code className="bg-white px-2 py-1 rounded">pass_bad</code></p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                More test credentials available at:{' '}
                <a
                  href="https://plaid.com/docs/sandbox/test-credentials/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  plaid.com/docs/sandbox/test-credentials
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
