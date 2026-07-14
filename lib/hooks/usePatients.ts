'use client';
import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/lib/types';

export default function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatients(prev => {
        if (prev.length === data.length && JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
      setError(null);
    } catch {
      setError('Connection lost');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  return { patients, loading, error, refresh: fetchPatients };
}
