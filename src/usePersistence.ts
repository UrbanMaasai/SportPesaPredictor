import { useState, useEffect, useCallback } from 'react';
import { Selection } from './types';

interface SavedSlip {
  id: string;
  jackpotType: 'mega' | 'midweek';
  selections: Selection[][];
  totalCombinations: number;
  totalPrice: number;
  strategy: string;
  createdAt: string;
  smsCode: string;
}

const STORAGE_KEY = 'jackpotiq_slips';
const SESSION_KEY = 'jackpotiq_session';

export function usePersistence() {
  const [savedSlips, setSavedSlips] = useState<SavedSlip[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [session, setSession] = useState<{
    jackpotType: 'mega' | 'midweek';
    activeStrategy: string;
    matchCount: number;
  } | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist slips
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSlips));
    } catch { /* quota exceeded */ }
  }, [savedSlips]);

  // Persist session
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch { /* quota exceeded */ }
    }
  }, [session]);

  const saveSlip = useCallback((slip: Omit<SavedSlip, 'id' | 'createdAt'>) => {
    const newSlip: SavedSlip = {
      ...slip,
      id: `slip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setSavedSlips(prev => [newSlip, ...prev].slice(0, 50)); // Keep last 50
    return newSlip;
  }, []);

  const deleteSlip = useCallback((id: string) => {
    setSavedSlips(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSession = useCallback((data: Partial<typeof session>) => {
    setSession(prev => prev ? { ...prev, ...data } : null);
  }, []);

  const initSession = useCallback((data: { jackpotType: 'mega' | 'midweek'; activeStrategy: string; matchCount: number }) => {
    setSession(data);
  }, []);

  return {
    savedSlips,
    session,
    saveSlip,
    deleteSlip,
    updateSession,
    initSession,
  };
}
