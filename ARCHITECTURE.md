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
|   `-- providers
|       `-- auth-provider.tsx
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
- `core/providers`: app-wide providers (for example auth/session).
- `shared/*`: UI primitives and utility hooks reused by many features.
- `components/*`: cross-feature composed UI blocks (header, footer, cards, shells).
- `lib/*`: framework-agnostic utilities and domain types.
