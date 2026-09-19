# Marvel Atlas

[![Quality](https://github.com/MykolaDotsenko/Marvel-Starter-React-App/actions/workflows/quality.yml/badge.svg)](https://github.com/MykolaDotsenko/Marvel-Starter-React-App/actions/workflows/quality.yml)

**A resilient, accessible Marvel character discovery experience built as a modern React engineering case study.**

[Live demo](https://marvel-starter-phi.vercel.app/) · [Architecture](./ARCHITECTURE.md) · [Browser tests](./e2e/marvel-atlas.spec.js)

Marvel Atlas turns an early Create React App training project into a focused product for searching Marvel characters, opening a shareable character dossier, inspecting recent comics, and keeping a local shortlist.

## Product capabilities

- search Marvel characters by name prefix
- browse a paginated alphabetical character feed
- open a character dossier without losing discovery context
- inspect recent comic appearances with cover, issue and price metadata
- save/remove local favorites with no account
- open a real **Saved** shortlist view
- open a real **Recently viewed** history view
- record direct/shared character URLs as viewed after successful load
- share or reload exact state through `?q=...&character=...`
- browser Back/Forward support without a router dependency
- explicit loading, empty, error, retry and pagination-failure states
- responsive desktop/mobile experience
- reduced-motion and forced-colors support
- no analytics, cookies, account system, or tracking

## Stack

### Runtime

- React **19.3**
- React DOM **19.3**
- semantic HTML
- modern CSS
- native History / URLSearchParams
- Web Storage API
- Fetch API + AbortController
- Marvel public API called directly from the browser with a public API key

There is **no runtime state library, router, UI kit, animation package, or API client dependency**.

### Verification

- Vite **8.3**
- Vitest **5**
- ESLint **10**
- Playwright **1.63**
- axe-core
- GitHub Actions
- Dependabot

## Architecture

```text
React UI
  |
  +--> feature hooks
  |       |
  |       +--> Marvel API boundary
  |       |       |
  |       |       +--> pure domain normalization
  |       |
  |       +--> URL/history state
  |       |
  |       +--> local preference adapter
  |
  +--> semantic HTML + CSS
```

The important dependency rule is:

> **External Marvel payloads are normalized before UI components see them, and pure domain rules do not know React or the browser exists.**

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full rationale and rejected alternatives.

## Reliability model

The original training implementation coupled request state directly to components and could leave stale requests alive. Marvel Atlas makes the network boundary explicit:

- obsolete list/detail requests are aborted;
- every request has a **10 second timeout**;
- successful responses use a short **5 minute / 50-entry LRU-style memory cache**;
- pagination failure preserves the results already on screen;
- a secondary comics failure does not destroy a valid character dossier;
- malformed collection payloads fail closed;
- query changes cannot render an old character list over a newer search;
- storage failure never prevents browsing.

React Strict Mode is enabled so development exercises effect setup/cleanup behavior.

## Bugs fixed from the original project

### Character comics silently missing

The original service returned:

```js
cocomics: char.comics.items
```

while the detail UI expected:

```js
char.comics
```

The mismatch meant the comics list never reached the component. The new domain normalizer has one canonical `comics` field and a regression test for this exact failure.

### Direct DOM mutation for selection

The old character list maintained an array of DOM refs and toggled CSS classes through `classList`. Selection is now ordinary React state represented in the URL and rendered declaratively with `aria-pressed`.

### Requests without cancellation

Character-list, random-character and detail requests previously continued after state changes or unmount. The current hooks use `AbortController` cleanup and bounded timeouts.

### Non-recovering error state

The previous random-character request could enter an error state and fail to reset it cleanly on another attempt. The new request state is initialized explicitly for every operation and all error surfaces provide deterministic recovery behavior.

### Hard-coded comics screen

The previous `ComicsList` / `SingleComic` surfaces were static mock markup with `href="#"`. Character dossiers now load real comic metadata from Marvel.

### Legacy toolchain

Create React App / `react-scripts` was replaced with Vite 8 and the current React 19 line. The production dependency graph is now only React + React DOM.

## URL-driven state

A meaningful discovery can be copied directly:

```text
/?q=Spider&character=1009610
```

The URL is the durable navigation state for search, selected character, and the active Explore / Saved / Recent view. Temporary concerns such as loading flags and API payloads remain in memory.

## Local preferences

Only deliberate local user intent is persisted:

```json
{
  "favorites": [1009610],
  "recent": [1009610, 1009629]
}
```

Corrupt storage is normalized safely and recent history is bounded.

## Accessibility

The product uses native semantics first:

- skip navigation
- one clear page heading hierarchy
- labeled search field
- native buttons and links
- descriptive action names
- `aria-pressed` for selected and favorite state
- visible keyboard focus
- useful status announcements
- reduced-motion support
- forced-colors support
- mobile reflow without horizontal overflow

The Playwright suite runs automated axe analysis on the main interactive state.

## Run locally

Requirements:

- Node.js 24+
- a Marvel **public** API key if you want to use your own key

```bash
npm ci
npm run dev
```

Optional:

```bash
cp .env.example .env.local
```

Then set:

```text
VITE_MARVEL_PUBLIC_KEY=your_public_marvel_key
```

Marvel Atlas intentionally uses Marvel's browser integration: the **public key is client-visible** and requests go directly to `gateway.marvel.com` in local, Vercel, and GitHub Pages builds.

No Marvel private key is required by this project. Do not add a private key to Vite variables, GitHub Pages, source code, or the browser bundle.

If the Marvel developer account restricts browser referrers, allow the deployed origins used by this repository, including:

```text
https://marvel-starter-phi.vercel.app
https://mykoladotsenko.github.io
```

The checked-in demo public key can be overridden with `VITE_MARVEL_PUBLIC_KEY` when a different public key is desired.

## Quality gates

Fast verification:

```bash
npm run check
```

This runs:

1. ESLint with zero warnings
2. deterministic Vitest unit tests
3. Vite production build

Browser verification:

```bash
npx playwright install chromium firefox webkit
npm run test:e2e
```

The browser suite mocks the Marvel API so PR CI is deterministic and does not depend on upstream availability or API quota. A separate scheduled workflow runs a small live Marvel API contract smoke so upstream shape changes become visible without making pull requests flaky.

It verifies:

- search and URL synchronization
- detail loading and comic rendering
- Saved and Recent views
- direct/shared URL recent-history semantics
- initial request retry
- non-fatal comics failure
- Back / Forward restoration
- favorite persistence across reload
- automated accessibility
- horizontal-overflow protection across the browser matrix

## Repository structure

```text
src/
├── api/
│   └── marvelClient.js
├── app/
│   └── App.jsx
├── components/
│   ├── CharacterDetail.jsx
│   ├── CharacterGrid.jsx
│   ├── Header.jsx
│   └── SearchPanel.jsx
├── domain/
│   └── marvel.js
├── hooks/
│   ├── useCharacterCollection.js
│   ├── useCharacterDetails.js
│   ├── useCharacterList.js
│   └── useUrlState.js
├── storage/
│   └── preferences.js
├── main.jsx
└── styles/
    ├── index.css
    ├── reset.css
    ├── tokens.css
    ├── base.css
    ├── header-hero.css
    ├── search.css
    ├── layout.css
    ├── characters.css
    ├── detail.css
    ├── feedback.css
    └── responsive.css

tests/
e2e/
.github/workflows/
```

## Scope discipline

Marvel Atlas is intentionally not a full Marvel social network, ecommerce store, or server-rendered catalog.

The current product does not need:

- Redux or another global store
- React Router for one screen and two URL parameters
- TanStack Query for one list + one detail query graph
- a component framework
- a custom backend
- authentication
- a database

Those tools become justified only when the product requirements create the corresponding complexity.

## Attribution

Data provided by Marvel. © 2026 MARVEL.

This is an independent portfolio project and is not affiliated with or endorsed by Marvel Entertainment.


## Live API contract monitoring

`Live Marvel API Contract` runs weekly and can also be launched manually. It
checks one real public API response for the minimum shape Marvel Atlas depends
on. This workflow is deliberately separate from pull-request CI: upstream
availability should be observable, but it should not make deterministic code
review gates flaky.

## Recruiter-facing repository metadata

Recommended GitHub metadata for this repository:

**Description**

> Marvel Atlas — a resilient React 19 character discovery app with URL-driven state, abortable Marvel API queries, local favorites, Playwright E2E and accessibility testing.

**Topics**

`react` · `react-19` · `vite` · `marvel-api` · `frontend` ·
`playwright` · `vitest` · `accessibility` · `javascript` · `portfolio`


## Browser API boundary

Marvel Atlas is intentionally backend-free. The browser calls the public Marvel catalog directly:

```text
Browser
  |
  +--> gateway.marvel.com/v1/public
          |
          +--> public API key
          +--> bounded query parameters
          +--> 10s client timeout
          +--> 5-minute / 50-entry in-memory cache
```

The public key is expected to be visible in a client-side application. No private Marvel credential is stored or required.

This keeps the portfolio deployment portable across Vercel and GitHub Pages and removes an unnecessary serverless hop. Browser-domain authorization, when enabled for the Marvel developer account, is the deployment-level access control.
