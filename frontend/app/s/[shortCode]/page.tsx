'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ShortUrlRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      const shortCode = params.shortCode as string;
      
      if (!shortCode) {
        setError('Invalid short code');
        setIsRedirecting(false);
        return;
      }

      try {
        // Redirect to backend API which will handle the redirect
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const redirectUrl = `${apiUrl}/utm/redirect/${shortCode}`;
        
        // Redirect to backend endpoint which will redirect to the original URL
        window.location.href = redirectUrl;
      } catch (err) {
        console.error('Error redirecting:', err);
        setError('Failed to redirect. Please try again.');
        setIsRedirecting(false);
      }
    };

    redirect();
  }, [params.shortCode, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/lead-form')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Lead Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

