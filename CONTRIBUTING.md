# Team workflow (hackathon)

`main` is always demo-ready. Everyone builds on a short branch and merges back often.

## Who owns what

| Person | Pages / features | Branch |
| --- | --- | --- |
| Akshya | Roadmap (done), UI + design system, Set up move, Care Card, ElevenLabs voice (done) | `feature/setup`, `feature/care` |
| Anusha | Documents (AI extraction), Payments, Reminders, Circle, Group Split | `feature/documents`, `feature/payments`, … |
| Sadana | Explain and flag, Scam Shield, Language switch, Setup and deploy | `feature/shield`, `feature/deploy`, … |

## First time

```bash
git clone https://github.com/akshyaprakkash05/Wise-LifeSwitch-IKU-Hack.git
cd Wise-LifeSwitch-IKU-Hack
npm install
copy .env.example .env.local    # Windows  (Mac/Linux: cp .env.example .env.local)
npm run dev
```

Ask Akshya privately for any API keys. Never paste keys in the repo, Discord or WhatsApp groups.

## Every feature, every time

```bash
git checkout main
git pull                          # start from the latest main
git checkout -b feature/payments  # one branch per feature
# ...build...
npm run build                     # must pass before you push
git add -A
git commit -m "Payments: transfer list and confirm step"
git pull origin main              # bring in teammates' work, fix any conflicts
git push -u origin feature/payments
```

Then open a **Pull Request** into `main` on GitHub. Someone else glances at it and merges. Delete the branch after merging.

Keep branches short: aim to merge every 1 to 2 hours. Small, frequent merges = no painful conflicts at the end.

## Where your code goes

- Page: `src/app/<route>/page.tsx` (e.g. `src/app/payments/page.tsx`), then set `live: true` for that route in `src/lib/nav.ts`.
- Components: `src/components/<feature>/` (e.g. `src/components/payments/`).
- Reuse the styles in `src/app/globals.css` (`card`, `btn`, `pill`, `banner`, …) and the icons in `src/components/Icon.tsx`.
- Money and Wise: always go through `src/services/payments.ts`. Nothing sends without a confirm step.

## Shared files: small edits only, tell the team

`src/state/app-state.tsx`, `src/lib/types.ts`, `src/lib/demo-data.ts`, `src/lib/i18n.ts`, `src/lib/nav.ts`, `src/app/globals.css`, `package.json`.

Add to them; don't rewrite or reorder them. Post in the group chat when you change one, so others pull it.

## Before the demo

- Feature freeze at the agreed time: only fixes after that.
- Everyone merges into `main`, then one person runs `npm run build` and the full demo flow on `main`.
- Add a row to `AI_USAGE.md` for any AI you used.
