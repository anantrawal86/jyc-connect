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

- Pages read data only through src/services/api.ts (dev data until VITE_API_URL is set) and images only through src/services/images.ts — so the future Express backend plugs in without UI rewrites.
- Council members come only from src/data/council.ts (official list); never invent names, positions or official JYC facts.
