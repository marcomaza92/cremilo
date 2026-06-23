/**
 * Calculates Return on Investment (ROI) as a percentage.
 * @param capital - Initial capital invested
 * @param interest - Interest or profit earned
 * @returns ROI percentage ((interest / capital) × 100)
 */
export function calculateROI(capital: number, interest: number): number {
  return (interest / capital) * 100;
}
