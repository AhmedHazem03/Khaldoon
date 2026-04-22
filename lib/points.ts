/**
 * Points calculation helpers for مطعم خلدون
 * All values use integer EGP (piastres not used).
 * points_balance and adjustments are always whole points.
 */

/**
 * Calculate maximum EGP discount a user can take via points.
 *
 * Rules (Constitution Principle V — from settings table):
 * - Cap 1: user's point balance × point value in EGP
 * - Cap 2: subtotal × max_points_discount_pct / 100
 * - Result rounded DOWN to nearest point-value multiple (integer multiples only)
 */
export function calcMaxDiscount(
  balance: number,
  pointValue: number,
  subtotal: number,
  maxPct: number
): number {
  const cap1 = balance * pointValue;
  const cap2 = (subtotal * maxPct) / 100;
  const raw = Math.min(cap1, cap2);
  // Round down to nearest multiple of pointValue
  return Math.floor(raw / pointValue) * pointValue;
}

/**
 * Calculate how many loyalty points are earned for a given subtotal.
 * Points are earned on subtotal only (not delivery fee or discounts).
 * Formula: floor(subtotal / 100) × points_per_100_egp
 */
export function calcPointsEarned(
  subtotal: number,
  pointsPer100: number
): number {
  return Math.floor(subtotal / 100) * pointsPer100;
}

/**
 * Convert a points amount to its EGP equivalent.
 */
export function pointsToEgp(points: number, pointValue: number): number {
  return points * pointValue;
}

/**
 * Convert an EGP amount to the equivalent number of points.
 * Rounds down to nearest whole point.
 */
export function egpToPoints(egp: number, pointValue: number): number {
  if (pointValue <= 0) return 0;
  return Math.floor(egp / pointValue);
}
