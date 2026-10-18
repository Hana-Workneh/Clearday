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
- Pay faster uses pure final-payment interpolation for estimates/bars and tested exact-input parsing; the monthly engine owns dates, interest and persistence — avoids invented daily math.
- Product tours use client-loaded driver.js with shared Sprout/buttons, session-storage demo dismissal and owner-keyed local account dismissal; pending replay survives navigation and startup waits for visible Home targets — prevents lost starts without writing financial data.
- Ask Sprout uses owner-scoped rows, verified placeholders and one service-only atomic UTC claim for visitor/global demo counters, separate from account limits; capped demos stream free calculated replies before any paid provider. Tests mock counters/network and run SQL in an isolated database — prevents race-condition overspend, anonymous spending and test allowance consumption.
- Setup loan-entry validation and automatic commits live in pure `src/lib/loan-entry.ts` with tests — both add-another and continue use the same field rules and stable IDs for edits.
- Setup's companion preview is presentational and receives live form values; only existing setup actions save loans or calculate the final plan — visual feedback must not change financial or persistence rules.
- Debt math lives in `src/lib/debt.ts` as pure functions with tests in `debt.test.ts` — keeps the plan instant in the browser and verifiable.
- `src/lib/store.ts` reads and writes authenticated progress in an owner-scoped Cloud profile JSON document; anonymous real drafts stay local until imported, while demos use separate session storage — prevents sample imports and account-to-account cache leaks.
- Public demo/account pages use AppEntry to await browser restoration before mounting; intentional setup uses a session marker. Private operations retain RLS and verified server functions — prevents refresh crashes without weakening privacy.
- Account profile documents use shared client/server validation in `src/lib/account-data.ts`, authenticated server-function writes and database validation for direct writes; stable loan/payment IDs keep imports idempotent and prevent bypassing input checks.

- All mascot appearances use the shared `Sprout` component and semantic SVG color tokens — mood changes stay consistent across pages and themes.
- Welcome shares tested rate/slider-hint helpers across its character/flag panel; hero-only thumbs isolate hint styling, session claims prevent replay, and input cancels animation — keeps math and app controls unchanged.
- Header branding uses shared `CleardayLogo` assets — keeps branding consistent.
- Welcome showcase mini screens use a display-only Hana demo snapshot and the shared debt engine, Sprout and theme tokens; they never read accounts or save payments — keeps previews reliable and separate from user finances.
- Time labels share a formatter; chat units normalize after verified tokens — preserves checked numbers and grammar.
- My plan timeline, suggestion impact and job-tag rules (`safeAdvice`) live in pure `src/lib/plan.ts` with tests; AI returns a cleaned job label and ideas, never payoff calculations or tag text — keeps estimates consistent and stops offensive titles being echoed.
- AI runs in a bearer-verified streaming TanStack server route at `/api/advice` with server-only helpers and a service-only durable pause table — prevents anonymous paid requests and keeps prompts/keys private.
- Suggested extras are previewed in the shared IdeaPreview dialog and confirmed through planFromIdea, or passed through validated Pay faster search state without saving — both paths reuse the debt engine and preserve the user's chosen loan order.
- Completed-loan stats and nonmutating demo previews live in pure `src/lib/celebration.ts` with tests; all completion screens use `DebtFreeMoment` — keeps earned milestones separate from sample previews.
- All progress uses pure debtProgress principal totals/percentages and principal-weighted history dates, not gross payments — prevents interest inflating progress on Home, roads and accounts.
- Celebration image exports are prepared on a browser canvas using resolved theme colors and the exact visible Sprout before download; new savings goals stay in the existing owner-scoped profile document — avoids CSS export clipping, preserves mobile download activation and completed-loan history.
- AI idea requests are capped per account per UTC day by a service-only atomic counter (claim_ai_advice) checked in /api/advice before calling the model — demo ideas are fixed and never hit the AI.
- Demo personas use session-keyed profiles/chat and shell remounts; root `DemoBar` reuses actions and a tested session toast claim — prevents leaks and repeated welcome notices.
- How it works uses display-only scenes with shared characters/hero tokens and once-only scroll animations — separates story examples from account calculations.
