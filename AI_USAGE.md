# AI usage and transparency

This file is kept up to date through the hackathon so judges can see exactly where AI was used.

## AI inside the product

| Where | What the AI does | Status |
| --- | --- | --- |
| Document reading | Gemini reads offer letters, tenancy agreements and invoices and returns each payment as structured JSON (payee, amount, currency, due date, reference, source sentence) | Planned. The Roadmap currently uses seeded demo data in `src/lib/demo-data.ts` |
| Term explanations | Plain-language explanations in the user's language | Currently hand-written in `src/lib/i18n.ts`; Gemini will generate them for new terms |
| Voice | ElevenLabs `eleven_multilingual_v2` reads the roadmap aloud in the chosen language (native Tamil voice for Tamil) | Live via `src/app/api/tts/route.ts`; browser voice as fallback |

Safeguards: every AI-extracted value shows the sentence it came from, and the user checks it before it joins the roadmap. Nothing is paid without the user's confirmation.

## AI used to build the product

| Part | Tool | What it did | What the team did |
| --- | --- | --- | --- |
| Product concept, brief, pitch | Claude | Helped structure and word the brief and pitch | Original idea, persona, feature choices and final wording by the team |
| UI design and mock-ups | Claude | Generated interactive mock-ups and the design direction (colours, type, layout) | Reviewed, directed changes (name, Circle map, layout), chose the final look |
| Roadmap code | Claude | Wrote the initial Next.js code for the Roadmap page, shell and mocked Wise payment flow | Reviewed, ran and tested it; owns all further changes |
| Voice button + ElevenLabs route | Claude | Wrote the TTS route and Listen button; picked default voices via the ElevenLabs voice library | Chose ElevenLabs, set up the account and key, tested the voice |

Team members should add a row when they use AI for their own feature.
