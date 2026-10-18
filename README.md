# Wise LifeSwitch

**Your payments and your people, in one place.**
IKU Womxn in STEM Hackathon (17–18 Oct 2026) · Wise track.

When you move abroad, you carry two things that don't fit in a suitcase: your payments and your people.
LifeSwitch sorts every payment the move demands and keeps your family close while you do it.

## What's live now: the Roadmap

- **Boarding pass** for the move (Chennai MAA → London LHR). The plane moves as payments are made.
- **Money roadmap**: every payment found in Tara's documents, sorted by due date, with status pills.
- **Payment detail**: the exact sentence the AI found it in, the payee and reference, and a warning when something is missing.
- **Plain-language explanations** of terms like *guarantor* and *CAS*, in the chosen language.
- **Pay with Wise**: Check → Confirm → Sent. Nothing sends without a ticked confirmation. A missing reference blocks the payment until it's added.
- **Progress ring, first-term budget, LifeSwitch Circle feed** that updates when a payment is made.
- **Rent reminder** pop-up with one-tap Pay with Wise.
- **Language dropdown** (English, Tamil, Hindi, Spanish, French, Chinese) that translates every screen, with dates and country names in each language's own format, and a **GBP / USD** toggle. Quotes from documents stay in their original language.
- **Listen** button reads the roadmap aloud with **ElevenLabs** (multilingual voice; native Tamil voice in Tamil), falling back to the browser voice if ElevenLabs isn't set up.
- **Reset demo** in the side menu puts everything back to the start.

## Set up move

- Choose where you're moving from and to, why (Study, Work, Family), the app language and your course or job.
- A live boarding-pass preview updates as you type and shows what LifeSwitch will look for in your documents.
- Picking the same country twice is blocked with a clear message.
- **Build my plan** saves the move (kept in this browser) and the Roadmap's boarding pass and top bar update to match.

The other menu items (Documents, Payments, Reminders, Circle, Group Split, Scam Shield, Care Card) open a "Coming next" page for now.

## Documents, Payments and Reminders (Sadana)

- **Documents**: drag and drop or choose a PDF/photo, or try a built-in sample (a fee invoice, or a fake "new bank details" message). `/api/extract` reads it with Gemini when `GEMINI_API_KEY` is set, otherwise runs the sample (the page says so). AI output is cleaned in `src/lib/tabs/normalize.ts`, then shown on a **review screen** with the sentence it came from. Nothing joins the roadmap until the student checks it, and new payments appear on the Roadmap too.
- **Payments**: prepared and sent lists, Check → Confirm → Sent. A missing reference blocks Continue. The Confirm step runs **Scam Shield** (IBAN and sort code checks, changed bank details, pressure or secrecy wording, gift card/crypto requests, money mule offers). `/api/payments/send` re-runs every check on the server and refuses a high-risk payment unless the student confirmed they checked.
- **Reminders**: one per unpaid payment plus the student's own, with on/off switches, an add form with validation, and **Trigger demo reminder**, which jumps to that payment.

Demo tip: click **Reset demo**, then Documents → "Try a 'new bank details' message" → Add → Payments → open it → Continue. Scam Shield catches it.

## Care Card (Sadana)

Safer spending for someone you care for, set up together with them (demo: Joseph's card).

- Daily limit slider, Alert me / Block it, and four shop types to watch (gambling, online marketplaces, cash over £50, phone and doorstep sales).
- Recent spending is re-checked live against the settings. "Try a card payment" adds a sample payment so you can see an alert happen.
- Every change shows a note that Joseph can see it. Rules are plain code in `src/lib/care/rules.ts` (no AI), tested in `tests/care.test.ts`.
- Settings are kept in this browser only (demo data, fictional cardholder).

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Turn on the ElevenLabs voice

1. Copy `.env.example` to a new file named `.env.local` (same folder as `package.json`).
2. Put your ElevenLabs API key after `ELEVENLABS_API_KEY=`.
3. Restart `npm run dev`.

The key stays on your machine: it's only read by the server route `src/app/api/tts/route.ts` and `.env.local` is git-ignored.

Other commands: `npm run build` (production build), `npm run typecheck`, `npm test`.

## How the code is organised

```
src/
  app/
    layout.tsx            App shell, fonts, state provider
    page.tsx              Roadmap (home)
    setup/page.tsx        Set up move
    [section]/page.tsx    "Coming next" pages for the other menu items
    api/fx/route.ts       GBP→USD rate (live public reference rate, falls back to a labelled sample)
    api/tts/route.ts      ElevenLabs text-to-speech (key stays server-side, cached, rate-limited)
    globals.css           Design tokens and styles (Wise palette + LifeSwitch saffron)
  components/
    AppShell.tsx          Side menu, top bar (language, currency, listen)
    roadmap/              Boarding pass, timeline, payment detail, cards, dialogs
    setup/                Set up move form and live preview
  lib/
    demo-data.ts          Tara's seeded roadmap (replaced by Gemini extraction later)
    i18n.ts               Translation lookup, dates in each language, term explanations
    messages/             UI text, one file per language (en.ts is the source; the build fails if a language misses a string)
    money.ts              Currency conversion and formatting
    places.ts             Countries, cities, airport codes and move purposes
    roadmap.ts            Status, progress and due-date logic
    types.ts              Shared types
  services/
    payments.ts           The one place that talks to Wise (mocked for the demo)
  state/
    app-state.tsx         App state (React context + reducer), saved in the browser
```

### Rules the code follows

- Never send money without explicit confirmation.
- Show the source sentence for every AI-extracted value.
- Circle sharing is opt-in.
- Wise-inspired colours; no Wise logo.

## Team workflow

1. `git pull` before you start.
2. Build your feature in its own folder under `src/components/<feature>/` and its page under `src/app/`.
3. Reuse the tokens and classes in `globals.css` so everything matches.
4. Commit small and often.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full team workflow and [AI_USAGE.md](AI_USAGE.md) for how AI was used in this project.
