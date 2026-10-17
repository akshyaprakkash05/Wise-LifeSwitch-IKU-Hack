"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type PaymentRequest, type Stripe } from "@stripe/stripe-js";

/**
 * Apple Pay through Stripe's Payment Request API. In Stripe test mode the
 * phone's real Apple Pay sheet and Face ID run, but no money is taken.
 * Renders nothing when Apple Pay (or Google Pay) isn't available here.
 */

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const country = process.env.NEXT_PUBLIC_STRIPE_COUNTRY || "GB";
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (pk ? (stripePromise ??= loadStripe(pk)) : Promise.resolve(null));

export function ApplePayButton({
  amountMinor,
  currency,
  label,
  createPayment,
  onPaid,
  onUnavailable,
}: {
  amountMinor: number;
  currency: string;
  label: string;
  /** Called after the user authorises; returns the PaymentIntent client secret. */
  createPayment: () => Promise<string>;
  /** Called once Stripe reports success. */
  onPaid: () => Promise<void> | void;
  onUnavailable?: (reason: "no_key" | "no_wallet") => void;
}) {
  const [pr, setPr] = useState<PaymentRequest | null>(null);
  const [wallet, setWallet] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handlers = useRef({ createPayment, onPaid });
  handlers.current = { createPayment, onPaid };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pk) return onUnavailable?.("no_key");
      const stripe = await getStripe();
      if (!stripe || cancelled) return;
      const req = stripe.paymentRequest({
        country,
        currency: currency.toLowerCase(),
        total: { label, amount: amountMinor },
      });
      const can = await req.canMakePayment();
      if (cancelled) return;
      if (!can) return onUnavailable?.("no_wallet");

      req.on("paymentmethod", async (ev) => {
        setError(null);
        try {
          const secret = await handlers.current.createPayment();
          const first = await stripe.confirmCardPayment(secret, { payment_method: ev.paymentMethod.id }, { handleActions: false });
          if (first.error) {
            ev.complete("fail");
            setError(first.error.message ?? "Payment failed.");
            return;
          }
          ev.complete("success");
          if (first.paymentIntent?.status === "requires_action") {
            const second = await stripe.confirmCardPayment(secret);
            if (second.error) throw new Error(second.error.message);
          }
          await handlers.current.onPaid();
        } catch (err) {
          ev.complete("fail");
          setError((err as Error).message || "Payment failed.");
        }
      });
      setWallet(can.applePay ? "apple" : "google");
      setPr(req);
    })();
    return () => {
      cancelled = true;
    };
    // Rebuild the sheet if the amount changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountMinor, currency, label]);

  if (!pr) return null;
  return (
    <div className="grid gap-2">
      {wallet === "apple" ? (
        <button
          type="button"
          onClick={() => pr.show()}
          aria-label="Pay with Apple Pay"
          className="apple-pay-button h-12 w-full rounded-full"
          lang="en"
        />
      ) : (
        <button type="button" onClick={() => pr.show()} className="h-12 w-full rounded-full bg-ink font-semibold text-white">
          Pay with Google Pay
        </button>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
