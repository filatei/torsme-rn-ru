import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '~/context/auth-context';
import { router } from 'expo-router';

export function useFetch<T = any>(baseUrl: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetch = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      console.log('Fetching:', `${baseUrl}${endpoint}`);
      console.log('Headers:', headers);

      const response = await global.fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

    //   console.log('Response status:', response.status);

      if (response.status === 401) {
        console.log('Unauthorized - redirecting to login');
        router.replace('/login');
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }

      const responseData: T = await response.json();
    //   console.log('Response data:', responseData);
      setData(responseData);
      return responseData;
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  // Add optimistic update function
  const optimisticUpdate = useCallback((updater: (currentData: T | null) => T | null) => {
    setData(prevData => updater(prevData));
  }, []);

  return { data, loading, error, fetch, optimisticUpdate };
}

// export  useFetch;

//const { data, loading, error, fetch, currentEndpoint } = useFetch('https://api.example.com', 'your-token');

// Fetch different endpoints
// await fetch('/expense');
// await fetch('/product');
// await fetch('/customer');
// await fetch('/shop');