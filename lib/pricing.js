// Change the price here — this is the only place it needs to be edited.
// Both the Stripe checkout route and the on-page display pull from this file.
export const PRICE_CENTS = 3000; // amount in cents, e.g. 3000 = $30.00
export const PRICE_DISPLAY = `$${(PRICE_CENTS / 100).toFixed(PRICE_CENTS % 100 === 0 ? 0 : 2)}`;
