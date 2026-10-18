# How we worked together

Four of us built LifeSwitch in under 24 hours. Our one rule: `main` is always demo-ready. Everyone built on their own branch, tested it, and merged back through a pull request.

## Who did what

| Person | Built | Branches |
| --- | --- | --- |
| Akshya | App shell and design system, Roadmap, Set up move, ElevenLabs voice, translations into six languages, combining everyone's work | `feature/setup`, `feature/i18n-full`, `preview/*` |
| Sadana | Documents, Payments, Reminders, the Scam Shield rules, Care Card | `sadana`, `sadana-care` |
| Anusha | Circle, Group Split, Scam Shield page | `feature/circle`, `feature/split`, `feature/shield` |
| Nessah | Research, slides, Devpost write-up, and the dashboard mock-up with the team | |

## Getting started

```bash
git clone https://github.com/akshyaprakkash05/Wise-LifeSwitch-IKU-Hack.git
cd Wise-LifeSwitch-IKU-Hack
npm install
copy .env.example .env.local    # Windows  (Mac/Linux: cp .env.example .env.local)
npm run dev
```

The app runs without keys using labelled samples. API keys were shared privately and never posted in the repo or group chats.

## Building a feature

```bash
git checkout main
git pull                          # start from the latest main
git checkout -b feature/payments  # one branch per feature
# ...build and test...
npm run build                     # must pass before pushing
npm test
git add -A
git commit -m "Payments: transfer list and confirm step"
git pull origin main              # bring in teammates' work and fix any conflicts
git push -u origin feature/payments
```

Then open a pull request into `main`. When several branches were ready at once, we first combined them on a `preview/` branch, checked every page loaded and the tests passed, and only then merged into `main`.

## Where code goes

- **Pages:** `src/app/<route>/page.tsx`, then `live: true` for that route in `src/lib/nav.ts`.
- **Components:** `src/components/<feature>/`.
- **Logic and rules:** `src/lib/<feature>/`, with tests in `tests/`.
- **Styles:** reuse `card`, `btn`, `pill`, `banner` and the colour tokens in `src/app/globals.css`, and the icons in `src/components/Icon.tsx`.
- **Money:** everything goes through `src/services/payments.ts`, and nothing sends without a confirm step.
- **Text on screen:** no English typed straight into components. Shared text lives in `src/lib/messages/` (one file per language), and each feature keeps its own text in `src/lib/<feature>/strings.ts`.

## Shared files

`src/state/app-state.tsx`, `src/lib/types.ts`, `src/lib/demo-data.ts`, `src/lib/i18n.ts`, `src/lib/nav.ts`, `src/app/globals.css` and `package.json` are used by everyone. We only added to them, never rewrote or reordered them, and told the group whenever one changed.

## Before the demo

- Feature freeze at the agreed time, with only fixes after that.
- Everything is merged into `main`, and one person runs `npm run build`, `npm test` and the full demo flow on `main`.
- Every use of AI is recorded in [AI_USAGE.md](AI_USAGE.md).
