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
- User data is stored in localStorage via `src/lib/store.ts` until Lovable Cloud is added — single place to swap storage later.
