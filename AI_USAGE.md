# AI usage and transparency

This file documents how AI was used during the hackathon and the work carried out by the team.

## AI inside the product

| Where | What the AI does | Status |
| --- | --- | --- |
| Document reading | Gemini extracts payment details from offer letters, tenancy agreements and invoices into structured JSON, including payee, amount, currency, due date, reference and source sentence. | Live on the Documents tab via `src/app/api/extract/route.ts`. Requires `GEMINI_API_KEY`; otherwise, a labelled sample is used. The Roadmap uses demo data from `src/lib/demo-data.ts`. |
| Term explanations | Provides plain-language explanations in the user's language. | Explanations are currently written in `src/lib/i18n.ts`. Gemini may be used for new terms. |
| Receipt reading | Gemini extracts receipt items, prices, service charges and extras into JSON. | Live via `src/app/api/split/scan/route.ts`. Bill-splitting calculations are handled by regular code. |
| Scam Shield | Gemini extracts the sender's identity and bank details from pasted messages or screenshots. Rule-based checks determine the risk verdict. | Live via `src/app/api/shield/read/route.ts`. Pattern matching is used if Gemini is unavailable, and users review the extracted details. |
| Voice | ElevenLabs `eleven_multilingual_v2` reads the roadmap aloud in the selected language, including a native Tamil voice for Tamil. | Live via `src/app/api/tts/route.ts`, with browser speech as a fallback. |
| Documents, Payments and Reminders | Claude Code was used for code suggestions, syntax fixes and debugging during development. | The team developed the features, made implementation decisions, wrote and adapted the code, and manually tested each flow. |

**Safeguards:** Each extracted value includes its source sentence and must be reviewed by the user before being added to the roadmap. Payments require user confirmation.

## AI used to build the product

| Part | Tool | How AI was used | What the team did |
| --- | --- | --- | --- |
| Product concept, brief and pitch | Claude | Used for background research, organising ideas and checking wording. | Created the original idea, user persona and feature choices, and finalised the brief and pitch. |
| UI design and mock-ups | Claude | Used to explore design options and create interactive mock-ups. | Defined the product direction, requested changes to the name, Circle map and layout, and chose the final design. |
| Roadmap code | Claude | Used for initial code examples for the Next.js Roadmap page, application shell and mocked Wise payment flow. | Developed the feature, reviewed and adapted the code, and tested the implementation. |
| Voice button and ElevenLabs route | Claude | Used for code suggestions for the text-to-speech route and Listen button, and to explore voice options. | Chose ElevenLabs, set up the account and API key, and tested the voice feature. |
| Circle (Anusha) | Claude Code | Used for code suggestions and implementation support for the Circle screens, API routes, Tiger Data Postgres schema, invite and join flow, chat, opt-in sharing, city-level location and initial Tamil and Hindi text. | Defined the feature scope, including no calling or streaks; chose Tiger Data and Safari location; reviewed the implementation and tested on phones. Tamil and Hindi text still requires native-speaker review. |
| Group Split (Anusha) | Claude Code | Used for code suggestions for the Gemini receipt-reading route, share calculations, Split screens and Apple Pay flow in Stripe test mode. | Designed the receipt-scanning and tagging flow, where each person pays their own share; chose Apple Pay in Safari; reviewed the implementation and tested with receipts and phones. |
| Care Card (Sadana) | Claude Code | Used for code suggestions and initial translation drafts in Tamil, Hindi, Spanish, French and Chinese. | Designed and developed the feature from the team mock-up, defined the spending rules, and reviewed and tested the implementation. Translations still require native-speaker review. |

Team members should add a row when they use AI for their own features.
