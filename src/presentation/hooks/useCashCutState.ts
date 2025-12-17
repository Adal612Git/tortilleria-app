import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';

const STATE_KEY = '@tortilleria/cashCutState';

export type CashCutState = {
  isOpen: boolean;
  openingFloat: number;
  openedAt: string | null;
};

const defaultState: CashCutState = {
  isOpen: false,
  openingFloat: 0,
  openedAt: null,
};

const buildKey = (userId?: number | null) => `${STATE_KEY}:${userId ?? 'anon'}`;

const parseState = (raw: string | null): CashCutState => {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw);
    return {
      isOpen: Boolean(parsed?.isOpen),
      openingFloat: Number(parsed?.openingFloat ?? 0),
      openedAt: parsed?.openedAt ?? null,
    };
  } catch {
    return defaultState;
  }
};

export const useCashCutState = () => {
  const [state, setState] = useState<CashCutState>(defaultState);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(buildKey(userId));
      setState(parseState(raw));
    } catch {
      setState(defaultState);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
};

export const openCashCut = async (openingFloat: number, userId?: number | null) => {
  const payload: CashCutState = {
    isOpen: true,
    openingFloat,
    openedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(buildKey(userId), JSON.stringify(payload));
};

export const closeCashCut = async (userId?: number | null) => {
  await AsyncStorage.setItem(buildKey(userId), JSON.stringify(defaultState));
};
