'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get OAuth state ID from URL parameters
    const oauthStateId = searchParams.get('oauth_state_id');

    if (oauthStateId) {
      // Redirect back to the main page with the OAuth state
      // Plaid Link will automatically handle the OAuth flow
      router.push(`/test-plaid?oauth_state_id=${oauthStateId}`);
    } else {
      // If no OAuth state, redirect to home
      router.push('/test-plaid');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing bank connection...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
