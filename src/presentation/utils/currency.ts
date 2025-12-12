const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

/**
 * Formats a numeric value as MXN currency while avoiding duplicated symbols.
 */
export const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  const safeValue = Number.isFinite(numeric as number) ? Number(numeric) : 0;
  return currencyFormatter.format(safeValue);
};
