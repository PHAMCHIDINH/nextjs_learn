# Frontend Modular Architecture

```
src
|-- app
|   |-- layout.tsx
|   |-- page.tsx
|   `-- globals.css
|-- modules
|   |-- home
|   |   |-- components
|   |   |-- hooks
|   |   `-- services
|   |-- auth
|   |   |-- components
|   |   |-- hooks
|   |   |-- services
|   |   `-- types
|   `-- users
|       |-- components
|       |-- hooks
|       |-- services
|       `-- types
|-- shared
|   |-- components/ui
|   |-- hooks
|   |-- lib
|   |-- constants
|   `-- types
`-- core
    |-- config
    `-- providers
```

Principles:
- `app/*`: Route entrypoints only (compose UI from modules).
- `modules/*`: Feature/business code grouped by domain.
- `shared/*`: Reusable code not tied to one business domain.
- `core/*`: App-wide providers and global configuration.
