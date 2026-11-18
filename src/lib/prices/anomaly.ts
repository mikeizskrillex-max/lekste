/** A price that moved by more than 50 % week over week waits for an admin before a basket may use it. */
export const JUMP_SHARE = 0.5;

export function isPriceJump(oldPrice: number | null, newPrice: number): boolean {
  if (oldPrice === null || oldPrice <= 0) return false;
  return Math.abs(newPrice - oldPrice) / oldPrice > JUMP_SHARE;
}
