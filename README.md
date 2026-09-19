# Marvel Reading Atlas

[![Quality](https://github.com/MykolaDotsenko/Marvel-Starter-React-App/actions/workflows/quality.yml/badge.svg)](https://github.com/MykolaDotsenko/Marvel-Starter-React-App/actions/workflows/quality.yml)

**A React 19 comic-discovery and reading-planning product built around a live, community-maintained Marvel metadata API.**

[Live demo on Vercel](https://marvel-starter-phi.vercel.app/) · [GitHub Pages mirror](https://mykoladotsenko.github.io/Marvel-Starter-React-App/) · [Architecture](./ARCHITECTURE.md) · [Browser tests](./e2e/reading-atlas.spec.js)

## Why this project changed

This repository began as a small Marvel character training app. The original Marvel Developer API later became unavailable, so keeping the old UI alive against a dead provider would have been the wrong product decision.

Marvel Reading Atlas treats that external failure as an engineering constraint:

1. isolate the provider boundary;
2. move to the maintained [Marvel Metadata API](https://marvel.emreparker.com/);
3. redesign the domain around data the provider is actually strong at;
4. turn a character browser into a useful comic-reading planner.

The result is not a hidden endpoint swap. It is a different product with a clearer user problem: **find Marvel issues, turn discovery into an ordered reading journey, and track progress without an account.**

## Product capabilities

- search 37,500+ indexed Marvel issues by title
- browse the newest indexed issues with bounded pagination
- open a shareable issue dossier through `?q=...&issue=...`
- inspect cover, series, publication date, page count and creator credits
- save issues to a local shortlist
- maintain a bounded recently-viewed history
- build an ordered reading list of up to 200 issues
- move issues up/down without an inaccessible drag-only interaction
- mark issues read/unread and see completion progress
- continue from the next unread issue
- persist deliberate user state as normalized issue snapshots
- keep Saved / Recent / Reading useful during provider downtime without N+1 hydration requests
- support browser Back/Forward with native History / URLSearchParams
- expose deterministic loading, empty, retry and pagination states
- run on both Vercel and GitHub Pages with no API key
- support reduced motion, forced colors and mobile reflow
- use no analytics, account system, cookies or tracking

## Runtime stack

- React **19.3**
- React DOM **19.3**
- Vite **8.3**
- semantic HTML
- modern layered CSS
- Fetch + AbortController
- History / URLSearchParams
- Web Storage
- [Marvel Metadata API](https://marvel.emreparker.com/)

Runtime dependencies are only React and React DOM. There is no router, state library, UI kit, animation package or API-client package.

## Provider contract

The active provider is an unofficial open-source metadata service, not Marvel Entertainment. Its current source exposes:

- `/v1/issues`
- `/v1/issues/{id}`
- `/v1/search/issues`
- series and creator endpoints for future expansion
- browser GET CORS
- a 60 requests/minute limit with burst allowance
- metadata only; no comic content

The app intentionally makes **one detail request only when an issue dossier is opened**. Explore/search cards consume summary payloads directly, avoiding N+1 detail fetches.

## Architecture

```text
React UI
  |
  +--> feature hooks
  |       |
  |       +--> Marvel Metadata provider adapter
  |       |       |
  |       |       +--> pure issue normalization
  |       |
  |       +--> URL/history state
  |       |
  |       +--> local reading-library adapter
  |
  +--> semantic HTML + layered CSS
```

Dependency rule:

> External provider payloads are normalized before UI components see them. Local reading state stores product-domain snapshots, not provider response blobs.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full rationale.

## Reliability model

- obsolete list/detail requests are aborted
- every network request has a **10 second timeout**
- successful responses use a **5 minute / 50-entry LRU-style memory cache**
- pagination failures preserve already-loaded results
- malformed list items fail closed instead of breaking the grid
- one-character searches are stopped before hitting the provider contract
- Saved / Recent / Reading list screens render from local snapshots and do not start a provider list request
- localStorage corruption resets safely
- React Strict Mode exercises effect cleanup in development
- weekly live API contract smoke detects upstream drift separately from deterministic PR CI

## URL state

Example:

```text
/?q=Secret+Wars&issue=52447&view=reading
```

The URL owns shareable navigation state:

- search query
- selected issue
- Explore / Saved / Reading / Recent view

Transient loading flags, request errors and provider payloads remain in memory.

## Local reading state

The browser stores only deliberate user intent plus compact normalized issue snapshots:

```json
{
  "saved": [{ "id": 52447, "title": "Secret Wars (2015) #1" }],
  "recent": [{ "id": 52447, "title": "Secret Wars (2015) #1" }],
  "readingList": [
    {
      "issue": { "id": 52447, "title": "Secret Wars (2015) #1" },
      "read": true
    }
  ]
}
```

Snapshots deliberately keep the user's reading journey legible even if the community provider is temporarily unreachable.

## Quality gates

```bash
npm ci
npm run check
npm run test:e2e
```

Pull requests verify:

- ESLint with zero warnings
- Vitest domain/API/storage tests
- Vite production build
- production dependency audit
- Chromium
- Firefox
- WebKit
- Pixel 7 viewport
- axe automated accessibility scan
- horizontal-overflow regression
- GitHub Pages base-path/provider bundle contract

A separate weekly smoke workflow checks the live provider so upstream availability cannot make ordinary pull requests flaky.

## Local development

Requirements: Node.js 24+

```bash
npm ci
npm run dev
```

No API key is required.

Optional provider override:

```bash
VITE_MARVEL_METADATA_API=https://example.test/v1 npm run dev
```

## Deployment

### Vercel

`vercel.json` builds Vite's `dist/` output.

### GitHub Pages

The Pages workflow builds with:

```text
VITE_BASE_PATH=/Marvel-Starter-React-App/
```

and asserts that the client bundle targets the current Marvel Metadata API rather than the retired Marvel gateway.

## Accessibility

- skip navigation
- semantic headings, lists, buttons and native progress element
- descriptive action names
- `aria-pressed` for durable toggles
- visible keyboard focus
- reduced-motion support
- forced-colors support
- no drag-only reading-list reorder interaction
- mobile reflow without horizontal overflow

## Data and trademark note

Marvel Reading Atlas is an unofficial portfolio project and is not affiliated with Marvel Entertainment. Metadata comes from the community-maintained Marvel Metadata API. No comic pages or paid comic content are distributed by this repository.

## Recommended repository metadata

**Description**

> Marvel Reading Atlas — React 19 comic discovery, ordered local reading lists, resilient provider architecture, Playwright E2E and accessibility testing.

**Topics**

`react` · `react-19` · `vite` · `marvel` · `frontend` · `playwright` · `vitest` · `accessibility` · `localstorage` · `portfolio`
