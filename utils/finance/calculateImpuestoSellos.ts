/**
 * Calculates Argentine "Impuesto de Sellos" (stamp duty) at 1.49%.
 * @param amount - Base amount
 * @returns Tax amount (amount × 0.0149)
 */
export function calculateImpuestoSellos(amount: number): number {
  return amount * 0.0149;
}
