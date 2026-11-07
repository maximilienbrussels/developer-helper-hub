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

- Keep supplemental public languages on the English URL carrier; a locale may be released with `partial: true` once its interface keys and main public phrases are covered, so the menu labels it as partial while untranslated extras (e.g. Academy records) fall back to English.
- Machine-translated phrase files (`<locale>-auto.ts`) are spread first in EXTRA_PHRASES so hand translations always override them.
- Translate public copy objects through deepTx and individual English content through tx; interpolate translated templates afterward so dynamic values retain their meaning.
- Use scripts/public-translations-audit.cjs for repeatable candidate inventories, not release approval; rendered pages, dynamic Academy records and downloadable documents require separate checks.
- Group supplemental visitor phrase translations in locale-specific visitor dictionaries and merge them into EXTRA_PHRASES, so public tx/deepTx callers share the same exact-English lookup.
- Keep pure OAuth URL validation in oauth-urls and internal return-path validation in redirect; share those rules across providers so callback cookies stay same-origin and malformed redirects cannot escape the site.
- Use the central portal access result for login navigation, coalesce concurrent auth events, and surface failed checks without redirecting as denied; transient outages must not create login loops.
- OAuth callbacks must pick their landing path through oauthLandingPath, and /auth auto-redirects go through the portal-login loop guard, because a path the current app mode cannot render bounces back to /auth in a loop.
- Event registrations live in event-signup.server (self-migrating columns on `events` + `event_registrations`); seats are claimed in one statement that locks the event row, so concurrent sign-ups can never exceed capacity.
- Birthday waiting-list date and capacity validation is shared between client and server; confirmation-email success is separate from team receipt so a failed copy never invites duplicate requests.
