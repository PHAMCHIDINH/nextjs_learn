# Frontend Modular Architecture

```
src
|-- app
|   |-- layout.tsx
|   |-- page.tsx
|   `-- ...route segments
|-- core
|   |-- api
|   |   |-- http.ts
|   |   `-- mappers.ts
|   |-- query
|   |   |-- keys.ts
|   |   `-- query-provider.tsx
|   |-- state
|   |   |-- auth-store.tsx
|   |   |-- notification-store.tsx
|   |   `-- chat-ui-store.tsx
|   `-- providers
|       |-- auth-provider.tsx
|       `-- notification-provider.tsx
|-- modules
|   |-- <feature>
|   |   |-- pages
|   |   `-- services
|   |-- auth
|   |-- users
|   |-- listings
|   |-- chat
|   `-- ...
|-- shared
|   |-- ui
|   `-- hooks
|-- components
|   `-- cross-feature composed components
`-- lib
    |-- types.ts
    `-- utils.ts
```

Principles:
- `app/*`: route entrypoints only; each route composes a page from `modules/*/pages`.
- `modules/*`: feature-level code. API calls for each feature live in `modules/*/services`.
- `core/api`: shared HTTP client, query builder, response mappers.
- `core/query`: React Query setup, query keys, server-state boundary.
- `core/state`: Zustand stores for shared client runtime state and realtime state.
- `core/providers`: app-wide compatibility providers that bootstrap stores and expose public hooks.
- `shared/*`: UI primitives and utility hooks reused by many features.
- `components/*`: cross-feature composed UI blocks (header, footer, cards, shells).
- `lib/*`: framework-agnostic utilities and domain types.

State boundaries:
- React Query manages server data fetching, caching, invalidation, and refetch.
- Zustand manages shared client state such as auth runtime state, notification badges, and chat UI preferences/drafts.
- `react-hook-form` manages form-local input and validation state.
