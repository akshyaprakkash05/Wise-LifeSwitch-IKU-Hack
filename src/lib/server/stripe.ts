import Stripe from "stripe";

/** Stripe in test mode powers Apple Pay for Group Split. Server-side only. */

export class NoStripeError extends Error {}

let client: Stripe | null = null;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new NoStripeError("STRIPE_SECRET_KEY is not set.");
  return (client ??= new Stripe(key));
}

export const stripeIsTestMode = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
