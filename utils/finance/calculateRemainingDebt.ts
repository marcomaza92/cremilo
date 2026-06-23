/**
 * Calculates remaining debt after N installments have been paid.
 * @param total - Total debt amount
 * @param installment - Amount paid per installment
 * @param currentN - Number of installments already paid
 * @returns Remaining balance (total − installment × currentN)
 */
export function calculateRemainingDebt(
  total: number,
  installment: number,
  currentN: number
): number {
  return total - installment * currentN;
}
