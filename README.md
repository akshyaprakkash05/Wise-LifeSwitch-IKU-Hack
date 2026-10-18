# Wise LifeSwitch

**Your payments and your people, carried for you.**
IKU Womxn in STEM Hackathon (17–18 Oct 2026) · Wise track · Prompt: Max Ease

When you move abroad, you carry two things that don't fit in a suitcase: your payments and your people. LifeSwitch carries both for you.

## The problem

Tara is 18 and moving from Chennai to London to study Computer Science. Before she even lands, she has to pay a room holding fee, a rent deposit, monthly rent and tuition. Every payment is buried in a different document, full of terms like *guarantor* and *CAS*, with its own deadline and reference. It's exactly the moment scammers send "our bank details have changed" emails. Her family wants to help, but from 8,000 km away they can't see what's paid and what isn't.

## What LifeSwitch does

LifeSwitch turns the paperwork of a move into one clear plan, pays each item safely with Wise, and keeps family involved without taking control away.

### Payments: from documents to done

- **Set up move.** Choose where you're moving from and to, why, and your language. The app builds your plan around it.
- **Roadmap.** Every payment of the move in date order, on a boarding pass that fills up as you pay. Unfamiliar terms are explained in plain language.
- **Documents.** Upload an offer letter, tenancy or invoice, or try a built-in sample. Gemini finds each payment (payee, amount, due date, reference) and shows the exact sentence it came from. The student checks every value on a review screen before anything is added.
- **Payments.** Each payment is prepared as a Wise transfer: Check, Confirm, Sent. Nothing is sent without confirmation, a missing reference blocks the payment, and the server re-runs every check before sending.
- **Reminders.** A reminder before every due date, plus the student's own, each one tap away from paying.

### Safety: stopping scams before money leaves

- **Scam Shield in Payments.** Checks bank details (IBAN checksum, sort code and account format), spots changed bank details for a known payee, and flags pressure, secrecy, gift card or crypto wording. A high-risk payment is blocked on the server unless the student confirms they've checked it.
- **Scam Shield page.** Paste any suspicious message or upload a screenshot. Gemini reads who wants paying, then the same rules give a clear verdict with the risky phrases highlighted and next steps (call your bank, forward scam texts to 7726, report to Action Fraud).

### People: help without losing control

- **Circle.** A private family group with chat, an invite link and opt-in updates like "Rent paid" (never the amount). Location is shared at city level only and can be paused at any time.
- **Group Split.** Snap a receipt, tag who had what, and each person pays only their share with Apple Pay (Stripe test mode).
- **Care Card.** Safer spending for someone you care for, set up together with them. They keep their own card. You choose a daily limit, alert or block, and which shops to watch (gambling, large cash withdrawals, online marketplaces, doorstep sales). Every change is shown to the cardholder.

### For everyone

Every screen works in **English, Tamil, Hindi, Spanish, French and Chinese**, amounts show in **GBP or USD**, and the **Listen** button reads the roadmap aloud with ElevenLabs.

## Try the demo in 2 minutes

1. Click **Reset demo** in the side menu.
2. **Documents** → *Try a "new bank details" message* → check it → **Add**.
3. **Payments** → open *Rent deposit (new details)* → **Continue**. Scam Shield blocks it.
4. Pay *Tuition instalment 1* instead: Check, Confirm, Sent.
5. **Reminders** → **Trigger demo reminder** → **Pay now**.
6. **Care Card** → **Try a card payment** and watch an alert appear.

## How we kept it safe

- Money never moves without the user's explicit confirmation.
- Every value AI reads is shown with its source sentence and checked by the user first.
- Scam Shield and Care Card use plain rules, not AI, so every warning can be explained.
- Family sharing is opt-in, never shows amounts, and location stays at city level.
- API keys stay on the server and are never committed.
- This is a demo: Wise transfers are mocked, Stripe runs in test mode, and all people and bank details are fictional.

## How it's built

Next.js 15, React 19 and TypeScript, styled with Tailwind and a Wise-inspired palette.

| Part | Technology |
| --- | --- |
| Reading documents, receipts and messages | Gemini, with output cleaned by our own code and checked by the user |
| Voice | ElevenLabs multilingual voice, with the browser voice as fallback |
| Circle and Group Split data | Postgres (Tiger Data) |
| Apple Pay in Group Split | Stripe (test mode) |
| Wise transfers | One service file, `src/services/payments.ts`, mocked for the demo and ready to connect to the Wise API |
| Tests | Vitest, covering payment checks, scam rules, reminders and Care Card |

AI was also used to build the project. See [AI_USAGE.md](AI_USAGE.md) for exactly where and how.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The app runs without any keys, using labelled samples. To turn the live services on, copy `.env.example` to `.env.local`, fill in the keys you have and restart:

| Key | Turns on |
| --- | --- |
| `GEMINI_API_KEY` | Live document, receipt and message reading |
| `ELEVENLABS_API_KEY` | The Listen voice |
| `DATABASE_URL` | Circle and Group Split (tables are created automatically) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Apple Pay in Group Split (test mode) |

Other commands: `npm run build`, `npm run typecheck`, `npm test`.

## Project structure

```
src/
  app/            One folder per page, plus api/ for server routes
  components/     roadmap/, setup/, tabs/ (Documents, Payments, Reminders), circle/, split/, shield/, care/
  lib/            Rules and data: scam/, care/, tabs/, circle/, shield/, messages/ (one file per language)
  services/       payments.ts, the one place that talks to Wise
  state/          App state, saved in the browser
tests/            Automated tests
```

## Team

| Who | Built |
| --- | --- |
| Akshya | App shell, Roadmap, Set up move, voice, translations, merging |
| Sadana | Documents, Payments, Reminders, Scam Shield rules, Care Card |
| Anusha | Circle, Group Split, Scam Shield page |
| Nessah | Research, slides, Devpost write-up, and the dashboard mock-up with the team |

See [CONTRIBUTING.md](CONTRIBUTING.md) for how we worked together.
