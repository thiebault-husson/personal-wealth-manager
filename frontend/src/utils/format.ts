/**
 * Shared formatting utilities for consistent display across the application
 */

/**
 * Format a number as currency with proper locale formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Prettify labels by capitalizing and replacing underscores with spaces
 * @param label - The label to prettify
 * @returns Prettified label string
 */
export function prettifyLabel(label: string): string {
  return label
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
