import { useCallback, useEffect, useMemo, useState } from 'react';

export type PaymentStatus = 'ready' | 'insufficient';

const sanitizeValue = (value: string) => {
  const digits = value.replace(/[^0-9.]/g, '');
  const parts = digits.split('.');
  if (parts.length <= 1) {
    return parts[0] || '0';
  }
  const base = parts.shift() ?? '0';
  return `${base}.${parts.join('')}`;
};

export const usePaymentFlow = (total: number) => {
  const [input, setInput] = useState('0');

  useEffect(() => {
    setInput('0');
  }, [total]);

  const paidAmount = useMemo(() => {
    const parsed = parseFloat(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [input]);

  const remaining = Math.max(total - paidAmount, 0);
  const change = paidAmount > total ? paidAmount - total : 0;
  const status: PaymentStatus =
    total <= 0 ? 'insufficient' : paidAmount >= total ? 'ready' : 'insufficient';

  const handleKeyPress = useCallback((key: string) => {
    setInput(prev => {
      if (key === 'C') {
        return '0';
      }
      if (key === '.' && prev.includes('.')) {
        return prev;
      }
      const next = prev === '0' && key !== '.' ? key : `${prev}${key}`;
      return sanitizeValue(next);
    });
  }, []);

  const setAmount = useCallback((value: string) => {
    setInput(sanitizeValue(value));
  }, []);

  const reset = useCallback(() => {
    setInput('0');
  }, []);

  return {
    input,
    paidAmount,
    remaining,
    change,
    status,
    handleKeyPress,
    setAmount,
    reset,
  };
};
