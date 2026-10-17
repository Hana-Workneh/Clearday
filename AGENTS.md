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
- Product tours use client-loaded driver.js with shared Sprout/buttons, session-storage demo dismissal and owner-keyed local account dismissal; pending replay survives navigation and startup waits for visible Home targets — prevents lost starts without writing financial data.
- Ask Sprout uses owner-scoped chat rows, a streaming server boundary and verified calculation placeholders; demo requests return deterministic calculation replies before the paid provider, conversations remain session-local and atomic server counters enforce daily limits — prevents anonymous AI spending.
- Setup loan-entry validation and automatic commits live in pure `src/lib/loan-entry.ts` with tests — both add-another and continue use the same field rules and stable IDs for edits.
- Setup's companion preview is presentational and receives live form values; only existing setup actions save loans or calculate the final plan — visual feedback must not change financial or persistence rules.
- Debt math lives in `src/lib/debt.ts` as pure functions with tests in `debt.test.ts` — keeps the plan instant in the browser and verifiable.
- `src/lib/store.ts` reads and writes authenticated progress in an owner-scoped Cloud profile JSON document; anonymous real drafts stay local until imported, while demos use separate session storage — prevents sample imports and account-to-account cache leaks.
- Shared demo and account pages remain public; private reads and writes use authenticated RLS and account deletion uses a middleware-verified server function — supports no-signup demos without weakening data privacy.
- Account profile documents use shared client/server validation in `src/lib/account-data.ts`, authenticated server-function writes and database validation for direct writes; stable loan/payment IDs keep imports idempotent and prevent bypassing input checks.

- All mascot appearances use the shared `Sprout` component and semantic SVG color tokens — mood changes stay consistent across pages and themes.
- Welcome character reactions live in an isolated presentational duo receiving calculator values; pure tested presentation helpers govern Stone and calculator replay limits, while a client-only measured motion hook moves the shared Sprout without changing finances; pointer gaze is frame-throttled — preserves supplied geometry and keeps phone rendering lightweight.
- Header branding uses the shared `CleardayLogo` with light/dark assets derived from the same logo; Home estimates reuse the existing debt engine — keeps branding consistent without changing financial rules.
- Welcome showcase mini screens use a display-only Hana demo snapshot and the shared debt engine, Sprout and theme tokens; they never read accounts or save payments — keeps previews reliable and separate from user finances.
- Calculated time labels share a browser-safe formatter; chat units are normalized only after verified token replacement — preserves financial checks while keeping singular/plural wording consistent.
- My plan timeline, suggestion impact and job-tag rules (`safeAdvice`) live in pure `src/lib/plan.ts` with tests; AI returns a cleaned job label and ideas, never payoff calculations or tag text — keeps estimates consistent and stops offensive titles being echoed.
- AI runs in a bearer-verified streaming TanStack server route at `/api/advice` with server-only helpers and a service-only durable pause table — prevents anonymous paid requests and keeps prompts/keys private.
- Suggested extras are previewed in the shared IdeaPreview dialog and confirmed through planFromIdea, or passed through validated Pay faster search state without saving — both paths reuse the debt engine and preserve the user's chosen loan order.
- Completed-loan stats and nonmutating demo previews live in pure `src/lib/celebration.ts` with tests; all completion screens use `DebtFreeMoment` — keeps earned milestones separate from sample previews.
- Home win selection is display-only in `src/lib/celebration.ts`, using exact balance thresholds and the latest logged payment — milestone accents never change financial or persistence rules.
- Celebration image exports are prepared on a browser canvas using resolved theme colors and the exact visible Sprout before download; new savings goals stay in the existing owner-scoped profile document — avoids CSS export clipping, preserves mobile download activation and completed-loan history.
- AI idea requests are capped per account per UTC day by a service-only atomic counter (claim_ai_advice) checked in /api/advice before calling the model — demo ideas are fixed and never hit the AI.
- Demo personas are generated by a browser-safe pure module; profile snapshots and chat identities are session-keyed per persona and shell content remounts on switches — prevents cross-persona state leaks without changing account persistence.
