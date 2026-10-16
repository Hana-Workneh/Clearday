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
- Debt math lives in `src/lib/debt.ts` as pure functions with tests in `debt.test.ts` — keeps the plan instant in the browser and verifiable.
- Existing user profiles remain browser-local via `src/lib/store.ts`; Cloud currently powers AI only — avoids changing account and storage flows during the My plan addition.

- All mascot appearances use the shared `Sprout` component and semantic SVG color tokens — mood changes stay consistent across pages and themes.
- My plan timeline and suggestion impact calculations live in pure `src/lib/plan.ts` with tests; AI supplies ideas, never payoff calculations — keeps estimates consistent with the debt engine.
- AI runs in a streaming TanStack server route at `/api/advice` with server-only helpers and a service-only durable pause table — keeps prompts/keys private and prevents replaying access denials.
- Suggested extras travel through validated Pay faster search state and are saved only with the existing plan confirmation — lets users review ideas before committing.
