# Marvel Atlas architecture

## Goal

Marvel Atlas is intentionally a client-side React product. The application reads
public Marvel catalog data, derives presentation state, and stores only local
user preferences. There is no business requirement for a backend, global state
library, router dependency, or component framework.

The architecture optimizes for **clear dependency direction, recoverable network
behavior, URL-addressable discovery state, and a small runtime surface**.

## Dependency direction

```text
React UI
  |
  +--> feature hooks ----------------------+
  |       |                                |
  |       +--> API boundary                +--> URL state
  |       |      |                         |
  |       |      +--> domain normalizers   +--> preferences adapter
  |       |
  |       +--> deterministic state
  |
  +--> semantic HTML + CSS
```

The domain module does not import React, browser storage, or DOM APIs.

## Boundaries

### `src/api/marvelClient.js`

Owns:

- Marvel endpoint construction;
- the public browser API key;
- request timeout and cancellation;
- response-shape validation at the collection boundary;
- short-lived response caching;
- character/comic normalization.

It does **not** own UI state.

### `src/domain/marvel.js`

Owns pure rules:

- external payload normalization;
- HTTPS URL normalization;
- fallback descriptions;
- search-term normalization;
- identity-based deduplication;
- favorites/recent list transitions.

These rules are unit tested without a browser.

### `src/storage/preferences.js`

Owns durable local user intent only:

- favorite character ids;
- recent character ids.

Search text, loading flags, errors, open panels, and API data are deliberately
not persisted. Corrupt storage falls back safely.

### `src/hooks/*`

Hooks orchestrate external systems:

- URL/history synchronization;
- abortable character-list requests;
- selected-character dossier requests.

Every network effect returns cleanup through `AbortController`, so React
Strict Mode can run setup/cleanup stress cycles without leaking obsolete
requests.

## URL as product state

The meaningful discovery state is shareable:

```text
/?q=Spider&character=1009610
```

Search and selected-character state therefore survive refresh, browser Back /
Forward, and copy-paste without adding React Router for a one-screen product.

## Reliability model

- **10 second timeout** prevents indefinite loading.
- **Abort on query/selection change** prevents obsolete responses from winning.
- **5 minute in-memory cache** reduces duplicate catalog calls without hiding
  freshness for long periods.
- **Existing results stay visible** when pagination fails.
- **Comic failure is non-fatal**: a character dossier can still render when the
  secondary comic request fails.
- **Unexpected API collections fail closed** instead of flowing arbitrary data
  into components.
- **Local storage is optional**: quota/privacy failures do not break the app.

## Why no TanStack Query?

For this app the query graph is tiny: one list request and one selected detail
request. A custom boundary is roughly one small file and makes the cancellation,
timeout, and cache behavior visible to a reviewer. TanStack Query would be a
good choice if the product added mutations, dependent query trees, background
revalidation, or multiple screens sharing server state.

## Why no router?

There is only one screen and two URL parameters. Native History + URLSearchParams
fully satisfy navigation, shareability, refresh, and Back/Forward behavior.
Adding route objects would create more surface without a product capability.

## Accessibility

The interface uses:

- one page `h1` and ordered heading levels;
- native search input and buttons;
- explicit labels and action names;
- `aria-pressed` for selected/saved toggles;
- skip navigation and visible focus;
- loading/status announcements where useful;
- reduced-motion handling;
- forced-colors fallbacks;
- axe browser verification.

## Testing pyramid

```text
Playwright + axe
      /\
     /  \
React/build/lint quality gate
   /      \
pure domain + storage unit tests
```

The browser suite mocks the Marvel API so CI is deterministic and does not
consume API quota or depend on upstream availability.
