# Bring the site up to the old site's level and beyond

Rule for every choice: if one option is even slightly better, take it, even when it means much more work. So no quick hardcoded fixes. Everything gets managed from the admin portal, in every language, and gets tested.

## 1. Real team and board, managed from the admin portal
- Remove the made-up names (Anatole, Karim, "N. Dubois"...).
- Add a new team section in the portal: name, role, photo, short bio and sort order, in NL, FR and EN (other languages use the existing translation setup). There is also a switch to show or hide each person.
- Seed it with the real people from the old site: Alexandre, Nicole, Philippine, Maral, Jeanne, Foti, Kim, Cécile, plus board chair Rachid Azaoum (and the rest of the board, once I have read it in full).
- Profile cards in the existing style, with a placeholder initial when there is no photo yet.

## 2. A full events calendar (better than the old site)
- Create events in the portal: title, dates (one day or several days), time, place on the farm, price (free or paid), number of spots, age group, photo, and NL/FR/EN text. Repeating events are also supported (for example "every first Saturday").
- Sign-up with a spots counter, a waiting list, and a confirmation email through the existing email system.
- The home page shows the next 2–3 events ("Coming up"), like the old site, but filled in automatically.
- An events page with month and list views, a filter by audience (family, school, business), and "add to my calendar".
- Search-engine markup for each event so events show up in Google with their date.
- Bring in the old site's current events (Balade MAXI biodiversity, the autumn camps).

## 3. Book any activity in one click
- Every school activity, birthday package, camp, team building and seminar gets its own "Book" button that opens the booking form with that activity already filled in.
- Check that each one actually works, on desktop and phone.

## 4. Old links keep working (search ranking and bookmarks)
- Forward every old address from lafermeduparcmaximilien.be (/anniversaire-champetre, /stages-enfants, /animations-pedagogiques, /contactus, /a-propos, /stage/..., /event/...) permanently to the right new page in the right language.
- Before that, I read the old site's full page list (sitemap) so no address gets missed.

## 5. Full content comparison, page by page
- Read every page of the old site, including the detail pages per activity and per internship, and record in a checklist what exists and what is missing.
- Restore the history (station → heliport → farm since 1987), the supporter logos with links, and the transport details (tram 51, metro, bus lines). Every item gets checked on the live page, not just in the code.

## 6. Quality bar before calling it done
- Automated tests for prices, opening hours, spots counter and booking rules.
- Visual check of every changed page on desktop and phone, in NL and FR.
- Speed and accessibility check of the home page and the events page.

## What I need from you
- **Database access:** the site stores its data in its own database (Neon). Without that connection key, I cannot test the team, events or bookings here.
- **The real team:** photos and the right roles. I start with the details from the old site.
- **Language choice:** confirm whether NL, FR and EN must always be fully written by hand.

## Technical details
- New tables `team_members`, `events`, `event_occurrences`, `event_registrations`, as Neon migrations (0050+), following the existing patterns for roles and permissions.
- Admin screens under `_authenticated`, with server functions that check the role.
- Redirects in a central map with server-side 301s, plus tests for each old URL.
- A schema.org `Event` and `Organization`/`Person` for search engines.
