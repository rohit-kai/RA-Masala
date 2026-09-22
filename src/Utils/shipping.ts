export const FREE_SHIPPING_THRESHOLD = 499;
export const FLAT_SHIPPING_FEE = 40;
export const COD_CONVENIENCE_FEE = 30;

export function isPrepaidMethod(method: string): boolean {
  const m = String(method || '').toUpperCase();
  return m === 'UPI' || m === 'CARD' || m === 'NETBANKING';
}

export interface ShippingResult {
  /** Base delivery charge (0 when free) */
  shipping: number;
  /** COD convenience fee (0 for prepaid) */
  codFee: number;
  /** shipping + codFee — what the customer pays as delivery */
  totalDelivery: number;
  isFreeShipping: boolean;
  isPrepaid: boolean;
  remainingForFreeShipping: number;
}

/**
 * Delivery rules:
 * - Free delivery on orders ≥ ₹499 (all customers)
 * - Flat ₹40 shipping below ₹499 (up to 1 kg — no weight slabs)
 * - Prepaid (UPI/Card/NetBanking): free delivery always (encourages online pay)
 * - COD: +₹30 convenience fee on top of base shipping
 */
export function calculateShipping(subtotal: number, paymentMethod: string): ShippingResult {
  const safeSubtotal = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  const prepaid = isPrepaidMethod(paymentMethod);
  const isCod = String(paymentMethod || '').toUpperCase() === 'COD';

  const qualifiesFree = safeSubtotal >= FREE_SHIPPING_THRESHOLD;
  const baseShipping = prepaid || qualifiesFree || safeSubtotal === 0 ? 0 : FLAT_SHIPPING_FEE;
  const codFee = isCod && safeSubtotal > 0 ? COD_CONVENIENCE_FEE : 0;

  return {
    shipping: baseShipping,
    codFee,
    totalDelivery: baseShipping + codFee,
    isFreeShipping: baseShipping === 0,
    isPrepaid: prepaid,
    remainingForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - safeSubtotal)
  };
}
