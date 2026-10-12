# MANUEL OAU NAVIGATOR

A lightweight React + Vite campus directory for Obafemi Awolowo University (OAU), Ile-Ife.

## Run locally (Windows / VS Code)

1. Install Node.js LTS if it is not installed.
2. Open this project folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173/`).

To make a production build, run `npm run build`.

## Configure WhatsApp

Open `src/App.jsx` and replace `234YOURNUMBER` in `WHATSAPP_NUMBER` with your number in international format, without `+`, spaces, or punctuation. Example format: `2348012345678` (example only, not a real contact for this project).

## Location data model

The location directory is in `src/data/places.js`, separate from the UI. Each entry is normalized to support:

- `id`, `name`, `aliases`, `category`, `subcategory`, `description`
- `latitude`, `longitude` (currently `null` unless a verified coordinate is added)
- `campusZone`, `routing` metadata and `sources`
- `status`: `verified_name`, `needs_location_check`, or `suggested`

Add a location to the `PLACES` list in that file using a unique ID and aliases people may search. Do not add guessed coordinates. A `verified_name` means the name has a public/official source; it does **not** mean its precise map pin or route is verified. Most entries are marked `needs_location_check` until exact positions can be checked against a reliable campus map or field survey.

## Current routing limitation

This version does not calculate an in-app route or claim verified distances/durations. It sends the selected names to Google Maps as a walking-directions search. Google Maps may resolve names imperfectly; users should check the selected pins. Accurate in-app navigation requires a reviewed campus GIS dataset (coordinates/building entrances), walkable paths, barriers, gates, and route graph.

## Suggestions / admin review limitation

The `Can't find your destination?` form stores suggestions in the current browser's `localStorage`; they are not automatically added to the directory. The local review panel can be opened with the link near the footer. This is a prototype, not a secure or shared admin dashboard: a real multi-user review workflow requires a backend/database and authentication.

## Public research references used to seed names

These sources support some institutional names and map features, not a claim that all OAU places are covered or that every pin is verified:

- OAU official Centres & Institutes: https://oauife.edu.ng/centres-institutes/
- OAU official institutional overview: https://oauife.edu.ng/about-oauife/
- OAU Central Science Laboratory: https://csl.oauife.edu.ng/facilities/
- OAU sports venues and facilities (university ePortal PDF): https://eportal.oauife.edu.ng/downloads/SPORTS.pdf
- Mapcarta / OpenStreetMap-based public entries for the campus and some buildings: https://mapcarta.com/33098838 and https://mapcarta.com/W617712378
- Research describing a revised OAU campus map based on imagery and ground survey: https://ifejost.oauife.edu.ng/index.php/ifejost/article/view/79

The public research also indicates that campus infrastructure changes over time, so this starter directory intentionally labels uncertain positions instead of fabricating coordinates.
