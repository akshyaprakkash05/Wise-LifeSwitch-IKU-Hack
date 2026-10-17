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
- **Language dropdown** (English, Tamil, Hindi, Spanish, French, Chinese) and **GBP / USD** toggle.
- **Listen** button reads the roadmap aloud (browser speech for now).
- **Reset demo** in the side menu puts everything back to the start.

The other menu items (Set up move, Documents, Payments, Reminders, Circle, Group Split, Scam Shield, Care Card) open a "Coming next" page for now.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other commands: `npm run build` (production build), `npm run typecheck`.

## How the code is organised

```
src/
  app/
    layout.tsx            App shell, fonts, state provider
    page.tsx              Roadmap (home)
    [section]/page.tsx    "Coming next" pages for the other menu items
    api/fx/route.ts       GBP→USD rate (live public reference rate, falls back to a labelled sample)
    globals.css           Design tokens and styles (Wise palette + LifeSwitch saffron)
  components/
    AppShell.tsx          Side menu, top bar (language, currency, listen)
    roadmap/              Boarding pass, timeline, payment detail, cards, dialogs
  lib/
    demo-data.ts          Tara's seeded roadmap (replaced by Gemini extraction later)
    i18n.ts               Translations and term explanations
    money.ts              Currency conversion and formatting
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

See [AI_USAGE.md](AI_USAGE.md) for how AI was used in this project.
