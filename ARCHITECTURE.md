# Marvel Reading Atlas — Architecture

## Product boundary

Marvel Reading Atlas is a client-side reading-planning product, not a generic API viewer.

The application owns:

- search/navigation UX
- issue normalization
- Saved / Recent snapshots
- ordered reading-list state
- read/unread progress
- retry and cancellation behavior
- URL-driven navigation
- accessibility and responsive behavior

The provider owns comic metadata.

## Why the domain changed

The repository originally modeled Marvel characters against the retired Marvel Developer API. When that provider ceased to be a viable runtime dependency, preserving the old character UI would have coupled the product to data that no longer existed.

The redesign follows the maintained provider's actual strengths:

```text
old: Character -> recent comics
new: Issue -> ordered reading journey
```

This is a product migration, not merely an endpoint migration.

## Dependency direction

```text
components
   |
feature hooks + storage
   |
domain normalization
   |
provider client
```

Components never consume raw provider responses.

## Provider adapter

`src/api/marvelMetadataClient.js` is the only module that knows:

- the provider base URL
- `/issues`
- `/search/issues`
- `/issues/{id}`
- provider pagination fields such as `has_next`

The rest of the application consumes normalized issue objects.

A future Metron or self-hosted provider can therefore implement the same domain contract without redesigning the UI state model.

## Request strategy

### Explore feed

`GET /v1/issues?limit=12&offset=N`

Summary payloads render cards directly.

### Search

`GET /v1/search/issues?q=...&limit=48`

The provider requires at least two search characters. The UI prevents a one-character request before the network boundary.

### Dossier

`GET /v1/issues/{id}`

This is the only detail request. It provides cover, description, page count and creator credits.

No list screen fans out into per-card detail requests.

### Local views

Saved, Recent and Reading list screens render their normalized local snapshots and pause the Explore list hook. They do not silently spend provider requests in the background.

Selecting a local issue still performs one detail request because the dossier intentionally shows current provider metadata.

## Resilience

Every provider request:

- is cancellable
- has a 10-second timeout
- participates in a 5-minute / 50-entry LRU-style cache

Malformed list items are dropped individually.

PR browser tests mock the provider deterministically. A weekly live contract smoke first loads one real issue summary, then opens that returned ID to verify the detail contract. This avoids hard-coding a single issue as a health dependency.

## Local-first reading state

The storage adapter persists compact issue snapshots rather than IDs only.

That is deliberate. Losing every title when a community provider is temporarily unavailable would destroy the value of a user-curated reading journey.

Stored state is bounded:

- Saved: 50
- Recent: 8
- Reading list: 200

Reading entries use:

```js
{
  issue: normalizedIssueSummary,
  read: boolean
}
```

No remote account or synchronization layer is required.

## Reading-list ordering

The application uses explicit Up / Down controls rather than a drag-only interface.

Reasons:

- keyboard accessible by default
- predictable on touch devices
- no runtime dependency
- no hidden gesture contract
- trivial immutable state transition
- straightforward cross-browser testing

Drag-and-drop can be added later as progressive enhancement without becoming the only reorder mechanism.

## URL ownership

The URL stores only shareable navigation state:

- `q`
- `issue`
- `view`

Loading flags, errors and response objects remain in memory.

Browser Back/Forward therefore restores meaningful discovery state without React Router.

## CSS architecture

The stylesheet is split by responsibility and ordered with cascade layers:

```text
reset
tokens
base
components
utilities
```

Product-specific modules include:

- search
- issues
- detail
- reading
- feedback
- responsive

## Rejected alternatives

### Keep the retired Marvel gateway

Rejected because a portfolio deployment should not knowingly depend on a dead provider.

### PokéAPI rewrite

Technically strong, but it discards the repository's Marvel identity and creates a more common portfolio category. Reading Atlas gives the project a more distinctive product story.

### Add a server proxy

The active metadata API requires no authentication and its source explicitly permits browser GET CORS. A proxy would add hosting, failure modes and code without protecting a secret or adding product value.

### Redux / Zustand

The state graph is small and feature-local. React state plus pure storage transitions is sufficient.

### React Router

There are three URL fields and no nested route tree. Native History and URLSearchParams keep the bundle and mental model smaller.

### TanStack Query

The request surface is small and the project intentionally demonstrates explicit cancellation/cache semantics. Adding a query library would cost more concepts than it removes here.

### Persist raw provider payloads

Rejected because provider response shape is infrastructure, not product state. Storage keeps normalized snapshots only.
