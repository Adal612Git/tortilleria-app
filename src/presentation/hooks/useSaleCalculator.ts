import { useCallback, useEffect, useMemo, useState } from 'react';

type Mode = 'pesos' | 'kilos';

export const useSaleCalculator = (incomingPricePerKg: number) => {
  const pricePerKg = incomingPricePerKg > 0 ? incomingPricePerKg : 0.000001;
  const [mode, setModeInternal] = useState<Mode>('pesos');
  const [rawValue, setRawValue] = useState('0');

  useEffect(() => {
    setModeInternal('pesos');
    setRawValue('0');
  }, [pricePerKg]);

  const parsed = useMemo(() => {
    const normalized = rawValue.replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
  }, [rawValue]);

  const moneyValue = mode === 'pesos'
    ? parsed
    : parsed * pricePerKg;

  const kilosValue = mode === 'kilos'
    ? parsed
    : parsed / pricePerKg;

  const sanitize = useCallback((next: string) => {
    const digits = next.replace(/[^0-9.]/g, '');
    const parts = digits.split('.');
    if (parts.length <= 1) {
      return parts[0] || '0';
    }
    const base = parts.shift() ?? '0';
    return `${base}.${parts.join('')}`;
  }, []);

  const setInput = useCallback((next: string) => {
    setRawValue(sanitize(next));
  }, [sanitize]);

  const formatValue = useCallback((value: number) => {
    if (!isFinite(value) || value <= 0) return '0';
    const fixed = value % 1 === 0 ? value.toString() : value.toFixed(3);
    return fixed.replace(/0+$/, '').replace(/\.$/, '');
  }, []);

  const setMode = useCallback((target: Mode) => {
    if (target === mode) return;
    setModeInternal(target);
    if (target === 'pesos') {
      setRawValue(formatValue(moneyValue));
    } else {
      setRawValue(formatValue(kilosValue));
    }
  }, [mode, moneyValue, kilosValue, formatValue]);

  const addMoney = useCallback((amount: number) => {
    const nextMoney = moneyValue + amount;
    if (mode === 'pesos') {
      setRawValue(formatValue(nextMoney));
    } else {
      setRawValue(formatValue(nextMoney / pricePerKg));
    }
  }, [moneyValue, mode, formatValue, pricePerKg]);

  const addKilos = useCallback((amount: number) => {
    const nextKilos = kilosValue + amount;
    if (mode === 'kilos') {
      setRawValue(formatValue(nextKilos));
    } else {
      setRawValue(formatValue(nextKilos * pricePerKg));
    }
  }, [kilosValue, mode, formatValue, pricePerKg]);

  const reset = useCallback(() => {
    setModeInternal('pesos');
    setRawValue('0');
  }, []);

  return {
    mode,
    setMode,
    input: rawValue,
    setInput,
    moneyValue,
    kilosValue,
    addMoney,
    addKilos,
    reset,
  };
};
