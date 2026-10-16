<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Setup loan-entry validation and automatic commits live in pure `src/lib/loan-entry.ts` with tests — both add-another and continue use the same field rules and stable IDs for edits.
- Debt math lives in `src/lib/debt.ts` as pure functions with tests in `debt.test.ts` — keeps the plan instant in the browser and verifiable.
- `src/lib/store.ts` reads and writes authenticated progress in an owner-scoped Cloud profile JSON document; anonymous real drafts stay local until imported, while demos use separate session storage — prevents sample imports and account-to-account cache leaks.
- Shared demo and account pages remain public; private reads and writes use authenticated RLS and account deletion uses a middleware-verified server function — supports no-signup demos without weakening data privacy.
- Account profile documents use shared client/server validation in `src/lib/account-data.ts`, authenticated server-function writes and database validation for direct writes; stable loan/payment IDs keep imports idempotent and prevent bypassing input checks.

- All mascot appearances use the shared `Sprout` component and semantic SVG color tokens — mood changes stay consistent across pages and themes.
- Header branding uses the shared `CleardayLogo` with light/dark assets derived from the same logo; Home estimates reuse the existing debt engine — keeps branding consistent without changing financial rules.
- My plan timeline and suggestion impact calculations live in pure `src/lib/plan.ts` with tests; AI supplies ideas, never payoff calculations — keeps estimates consistent with the debt engine.
- AI runs in a bearer-verified streaming TanStack server route at `/api/advice` with server-only helpers and a service-only durable pause table — prevents anonymous paid requests and keeps prompts/keys private.
- Suggested extras travel through validated Pay faster search state and are saved only with the existing plan confirmation — lets users review ideas before committing.
- Completed-loan stats and nonmutating demo previews live in pure `src/lib/celebration.ts` with tests; all completion screens use `DebtFreeMoment` — keeps earned milestones separate from sample previews.
- Celebration image exports are prepared on a browser canvas using resolved theme colors and the exact visible Sprout before download; new savings goals stay in the existing owner-scoped profile document — avoids CSS export clipping, preserves mobile download activation and completed-loan history.
