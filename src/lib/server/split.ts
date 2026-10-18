import { db } from "./db";
import { stripe } from "./stripe";
import { computeShares, unassigned, type Receipt } from "../split";

/** Group Split data access. Server-side only. */

export interface SplitView {
  id: string;
  merchant: string;
  currency: string;
  payer: string;
  created_at: string;
  shares: { id: string; person: string; amount_minor: number; items: string[]; status: "unpaid" | "paid"; method: string | null }[];
}

export class SplitInputError extends Error {}

export async function createSplit(input: { receipt: Receipt; people: string[]; payer: string; circleCode?: string | null }) {
  const { receipt, people, payer } = input;
  if (!people.includes(payer)) throw new SplitInputError("The person who paid must be in the group.");
  if (unassigned(receipt).length) throw new SplitInputError("Tag someone on every item first.");
  const shares = computeShares(receipt, people).filter((s) => s.amount_minor > 0);

  const pool = await db();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const s = await client.query(
      `insert into splits (circle_code, merchant, currency, payer, receipt) values ($1, $2, $3, $4, $5) returning id`,
      [input.circleCode ?? null, receipt.merchant, receipt.currency, payer, JSON.stringify(receipt)],
    );
    const id = s.rows[0].id as string;
    for (const sh of shares) {
      const isPayer = sh.person === payer;
      await client.query(
        `insert into split_shares (split_id, person, amount_minor, items, status, method, paid_at)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [id, sh.person, sh.amount_minor, JSON.stringify(sh.items), isPayer ? "paid" : "unpaid", isPayer ? "paid the bill" : null, isPayer ? new Date() : null],
      );
    }
    await client.query("commit");
    return id;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function getSplit(id: string): Promise<SplitView | null> {
  const pool = await db();
  const s = await pool.query(`select id, merchant, currency, payer, created_at from splits where id = $1`, [id]);
  if (!s.rowCount) return null;
  const shares = await pool.query(
    `select id, person, amount_minor, items, status, method from split_shares where split_id = $1 order by person`,
    [id],
  );
  return { ...s.rows[0], shares: shares.rows };
}

async function share(splitId: string, shareId: string) {
  const pool = await db();
  const r = await pool.query(
    `select sh.id, sh.person, sh.amount_minor, sh.status, sh.payment_intent, s.currency, s.merchant, s.payer
     from split_shares sh join splits s on s.id = sh.split_id where sh.split_id = $1 and sh.id = $2`,
    [splitId, shareId],
  );
  return r.rows[0] ?? null;
}

/** Creates (or reuses) a Stripe PaymentIntent for one person's share. */
export async function startPayment(splitId: string, shareId: string) {
  const sh = await share(splitId, shareId);
  if (!sh) return null;
  if (sh.status === "paid") throw new SplitInputError("This share is already paid.");
  if (sh.amount_minor < 30) throw new SplitInputError("This share is too small to pay by card.");

  if (sh.payment_intent) {
    const existing = await stripe().paymentIntents.retrieve(sh.payment_intent);
    if (existing.status !== "canceled" && existing.status !== "succeeded") {
      return { clientSecret: existing.client_secret!, amount_minor: sh.amount_minor, currency: sh.currency };
    }
  }
  const pi = await stripe().paymentIntents.create(
    {
      amount: sh.amount_minor,
      currency: String(sh.currency).toLowerCase(),
      allowed_payment_method_types: ["card"],
      description: `${sh.person}'s share at ${sh.merchant} (to ${sh.payer})`,
      metadata: { split_id: splitId, share_id: shareId },
    },
    { idempotencyKey: `share-${shareId}-${Date.now() >> 16}` },
  );
  const pool = await db();
  await pool.query(`update split_shares set payment_intent = $1 where id = $2`, [pi.id, shareId]);
  return { clientSecret: pi.client_secret!, amount_minor: sh.amount_minor, currency: sh.currency };
}

/** Marks a share paid only after Stripe confirms the PaymentIntent succeeded. */
export async function confirmPayment(splitId: string, shareId: string) {
  const sh = await share(splitId, shareId);
  if (!sh?.payment_intent) return false;
  const pi = await stripe().paymentIntents.retrieve(sh.payment_intent);
  if (pi.status !== "succeeded" || pi.amount !== sh.amount_minor) return false;
  const pool = await db();
  await pool.query(`update split_shares set status = 'paid', method = 'Apple Pay', paid_at = now() where id = $1`, [shareId]);
  return true;
}

/** "I paid another way" (cash, bank). Recorded as such, not as a card payment. */
export async function markPaidManually(splitId: string, shareId: string) {
  const pool = await db();
  const r = await pool.query(
    `update split_shares set status = 'paid', method = 'another way', paid_at = now()
     where split_id = $1 and id = $2 and status = 'unpaid'`,
    [splitId, shareId],
  );
  return Boolean(r.rowCount);
}
