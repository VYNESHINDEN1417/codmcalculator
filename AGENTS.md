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

- Keep weapon carousel items mounted and animate a continuous orbit angle with CSS depth ordering; crossing weapons pass behind the active weapon without image replacement.
- Keep the calculator warning state in the page, separate from carousel rotation; calculator conversion sets it and input edits clear it.
- Derive acquisition projections from conversion time plus required weekly grinds in the calculator utilities, and format calendar weeks in Asia/Manila so displayed dates stay consistent with the event clock.
- Keep all media assets (gun images and any future images, fonts, or media) as real files inside the repo under `src/assets/`, imported directly by Vite — never re-externalize them to CDN `.asset.json` pointers — so the synced repository serves them when deployed to Vercel.
- Keep the entry popup and looping audio in the root layout so calculator actions and route navigation cannot restart or pause playback; start audio only from the dismissal gesture.
