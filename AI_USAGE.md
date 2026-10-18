# AI usage and transparency

This file is kept up to date through the hackathon so judges can see exactly where AI was used.

## AI inside the product

| Where | What the AI does | Status |
| --- | --- | --- |
| Document reading | Gemini reads offer letters, tenancy agreements and invoices and returns each payment as structured JSON (payee, amount, currency, due date, reference, source sentence) | Live on the Documents tab via `src/app/api/extract/route.ts` (needs `GEMINI_API_KEY`; without it a built-in sample is used and labelled). The Roadmap starts from seeded demo data in `src/lib/demo-data.ts` |
| Term explanations | Plain-language explanations in the user's language | Currently hand-written in `src/lib/i18n.ts`; Gemini will generate them for new terms |
| Receipt reading | Gemini reads a receipt photo and returns each line item with its price, plus service charge and extras, as JSON. The share maths is ordinary code, not AI | Live via `src/app/api/split/scan/route.ts` |
| Scam Shield | The risk verdict uses rule-based checks, not AI. Gemini only reads who is asking for money and their bank details from a pasted message or screenshot (plain patterns are used if Gemini is unavailable), and the user checks what was read | Live via `src/app/api/shield/read/route.ts` |
| Voice | ElevenLabs `eleven_multilingual_v2` reads the roadmap aloud in the chosen language (native Tamil voice for Tamil) | Live via `src/app/api/tts/route.ts`; browser voice as fallback |

Safeguards: every AI-extracted value shows the sentence it came from, and the user checks it before it joins the roadmap. Nothing is paid without the user's confirmation.

## AI used to build the product

| Part | Tool | What it did | What the team did |
| --- | --- | --- | --- |
| Product concept, brief, pitch | Claude | Helped structure and word the brief and pitch | Original idea, persona, feature choices and final wording by the team |
| UI design and mock-ups | Claude | Generated interactive mock-ups and the design direction (colours, type, layout) | Reviewed, directed changes (name, Circle map, layout), chose the final look |
| Roadmap code | Claude | Wrote the initial Next.js code for the Roadmap page, shell and mocked Wise payment flow | Reviewed, ran and tested it; owns all further changes |
| Voice button + ElevenLabs route | Claude | Wrote the TTS route and Listen button; picked default voices via the ElevenLabs voice library | Chose ElevenLabs, set up the account and key, tested the voice |
| Circle (Anusha) | Claude Code | Wrote the Circle screens, API routes and Postgres schema (Tiger Data), the invite and join flow, chat, opt-in sharing and city-only location; drafted the Tamil and Hindi Circle text | Designed the feature and scope (no calling, no streaks), chose Tiger Data and Safari location, tested on phones; Tamil and Hindi to be checked by a native speaker |
| Group Split (Anusha) | Claude Code | Wrote the receipt-reading route (Gemini), the share maths, the Split screens and the Apple Pay flow through Stripe test mode | Designed the flow (snap, tag, each pays their own share), chose Apple Pay in Safari, tested with real receipts and phones |
| Care Card (Sadana) | Claude Code | Wrote the Care Card page from the team mock-up, the spending rules, tests and the Tamil, Hindi, Spanish, French and Chinese drafts | Sadana: owns the feature and reviewed and tested it; translations to be checked by native speakers |

Team members should add a row when they use AI for their own feature.
