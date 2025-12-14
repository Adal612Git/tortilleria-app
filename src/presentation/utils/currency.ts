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

/**
 * Formats quantities (piezas, kilos, etc.) with a fixed number of decimals.
 */
export const formatQuantity = (
  value: number | string | null | undefined,
  decimals = 0
) => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  const safeValue = Number.isFinite(numeric as number) ? Number(numeric) : 0;
  return safeValue.toFixed(decimals);
};
