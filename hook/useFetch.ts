import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '~/context/auth-context';
import { router } from 'expo-router';

export function useFetch<T = any>(baseUrl: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetchData = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<T | null> => {
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

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        console.log('Unauthorized - redirecting to login');
        router.replace('/login');
        return null;
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${text}`);
        }
        try {
          const responseData = JSON.parse(text);
          console.log('Parsed response data:', responseData);
          setData(responseData);
          return responseData;
        } catch (e) {
          console.log('Failed to parse response as JSON:', e);
          setData(null);
          return null;
        }
      }

      const responseData = await response.json();
      console.log('JSON response data:', responseData);
      
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

  return { data, loading, error, fetch: fetchData, optimisticUpdate };
}

// export  useFetch;

//const { data, loading, error, fetch, currentEndpoint } = useFetch('https://api.example.com', 'your-token');

// Fetch different endpoints
// await fetch('/expense');
// await fetch('/product');
// await fetch('/customer');
// await fetch('/shop');