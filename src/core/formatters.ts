/**
 * Centralized formatting utilities for the budget app.
 * Ensures consistent handling of currencies and decimals.
 */

interface IFormatCurrencyOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
}

/**
 * Formats a number as a currency string.
 * Default: EUR, ru-RU locale, 2 decimal places.
 */
export function formatCurrency(
  amount: number,
  options: IFormatCurrencyOptions = {}
): string {
  const {
    currency = 'EUR',
    locale = 'ru-RU',
    decimals = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats a number with specified decimal places.
 * Default: 2 decimal places.
 */
export function formatNumber(
  amount: number,
  decimals: number = 2,
  locale: string = 'ru-RU'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
