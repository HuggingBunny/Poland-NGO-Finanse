import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { invoke } from '../lib/invoke';
import type { LegalChangeWithStatus } from '../types';

interface LegalUpdatesContextType {
  updates: LegalChangeWithStatus[];
  urgentCount: number; // < 90 days, not dismissed
  loading: boolean;
  dismiss: (id: string) => Promise<void>;
  apply: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LegalUpdatesContext = createContext<LegalUpdatesContextType | null>(null);

export function LegalUpdatesProvider({ children }: { children: React.ReactNode }) {
  const [updates, setUpdates] = useState<LegalChangeWithStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<LegalChangeWithStatus[]>('get_legal_updates');
      setUpdates(data || []);
    } catch (e) {
      console.error('Failed to fetch legal updates', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Check daily
    const interval = setInterval(refresh, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const dismiss = async (id: string) => {
    await invoke('dismiss_legal_update', { change_id: id });
    setUpdates(prev => prev.map(u => u.change.id === id ? { ...u, dismissed: true } : u));
  };

  const apply = async (id: string) => {
    await invoke('apply_legal_update', { change_id: id });
    await refresh();
  };

  const urgentCount = updates.filter(u => !u.dismissed && u.days_until <= 90).length;

  return (
    <LegalUpdatesContext.Provider value={{ updates, urgentCount, loading, dismiss, apply, refresh }}>
      {children}
    </LegalUpdatesContext.Provider>
  );
}

export function useLegalUpdates() {
  const ctx = useContext(LegalUpdatesContext);
  if (!ctx) throw new Error('useLegalUpdates must be used within LegalUpdatesProvider');
  return ctx;
}
