/**
 * Converts an amount from one currency to another using a given rate.
 * @param amount - Amount in source currency
 * @param rate - Exchange rate (target / source)
 * @returns Converted amount (amount × rate)
 */
export function convertCurrency(amount: number, rate: number): number {
  return amount * rate;
}
