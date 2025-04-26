import { useState, useEffect } from 'react';
import { config } from '../utils/config';

export function useTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${config.apiUrl}/api/tags`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        const processedTags = Array.isArray(data) ? data : [];
        setTags(processedTags);
      } catch (err) {
        setError('Failed to fetch tags.');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
} 