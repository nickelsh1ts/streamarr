# Contributing to Streamarr

Thank you for your interest in contributing to Streamarr! We welcome contributions from everyone. This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Yarn](https://yarnpkg.com/) (v4, Berry)
- [Python 3](https://www.python.org/) (for the Plex invite service)
- [Git](https://git-scm.com/)

### Setting Up the Development Environment

1. **Fork the repository** on GitHub and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/streamarr.git
   cd streamarr
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Set up the config directory:**

   Streamarr uses a `config/` directory for settings, database, and logs. One will be created automatically on first run.

4. **Start the development server:**

   ```bash
   yarn dev
   ```

   This starts the Node.js server with hot reloading via `nodemon`. The app will be available at `http://localhost:3000`.

   To also start the Python Plex invite service (in a separate terminal):

   ```bash
   yarn start:python
   ```

5. **Verify everything works:**

   ```bash
   yarn typecheck   # TypeScript type checking
   yarn lint         # ESLint
   yarn css-lint     # Stylelint
   ```

## Development Workflow

### Branching

- The **`develop`** branch is the primary development branch.
- Create feature branches from `develop` using a descriptive name:
  - `feat/my-new-feature`
  - `fix/issue-description`
  - `docs/update-readme`

### Making Changes

1. Create a new branch from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/my-feature
   ```

2. Make your changes, following the conventions below.

3. Run the pre-commit checks before committing:

   ```bash
   yarn prepare
   ```

   This runs formatting, linting, and type checking.

4. Commit your changes with clear, descriptive commit messages.

5. Push your branch and open a Pull Request against `develop`.

### Pull Requests

- Provide a clear description of what your PR does and why.
- Reference any related issues (e.g., "Closes #123").
- Ensure all CI checks pass before requesting review.
- Keep PRs focused — one feature or fix per PR.
- Be responsive to review feedback.

## Project Structure

| Directory  | Purpose                                          |
| ---------- | ------------------------------------------------ |
| `server/`  | Express backend — API routes, entities, services |
| `src/`     | Next.js frontend — pages, components, hooks      |
| `public/`  | Static assets                                    |
| `docs/`    | User-facing documentation (GitBook)              |
| `cypress/` | End-to-end tests                                 |

## Conventions

### General

- **Path aliases**: Use `@server/*` and `@app/*` — no relative imports (enforced by ESLint).
- **TypeScript**: Strict mode is off by design. `experimentalDecorators` is enabled for TypeORM.
- **Formatting**: Prettier handles code formatting. Run `yarn format` or let `yarn prepare` handle it.

### Backend (`server/`)

- **Database**: Use `getRepository(Entity)` from `@server/datasource` — never instantiate repositories directly.
- **Routes**: Express routers registered in `server/routes/index.ts`. All endpoints must be defined in `streamarr-api.yml` (OpenAPI spec) first.
- **Auth**: `checkUser` middleware runs globally; use `isAuthenticated(Permission.X)` for route-level access control.
- **Logging**: Use the Winston logger from `@server/logger` with `{ label: 'ComponentName' }`.
- **Settings**: Access via `getSettings()` singleton from `@server/lib/settings.ts`.

### Frontend (`src/`)

- **Data fetching**: Use SWR for all client-side data (`useSWR<Type>('/api/v1/...')`).
- **State management**: React contexts in `src/context/` — no Redux.
- **i18n**: Use `react-intl` with the `useLocale` hook. Extract keys with `yarn i18n:extract`.
- **Styling**: Tailwind CSS. Classes are auto-sorted by the Prettier plugin.

### Database Migrations

- **Development**: `synchronize: true` — entity changes apply automatically.
- **Production**: Migrations run on startup. Generate from entity changes:

  ```bash
  yarn migration:generate server/migration/MigrationName
  ```

## Reporting Bugs

- Search [existing issues](https://github.com/nickelsh1ts/streamarr/issues) before opening a new one.
- Use the bug report issue template if available.
- Include steps to reproduce, expected behavior, and actual behavior.
- Include your environment details (OS, Node.js version, browser).

## Requesting Features

- Open a [GitHub Issue](https://github.com/nickelsh1ts/streamarr/issues) or start a [Discussion](https://github.com/nickelsh1ts/streamarr/discussions).
- Describe the problem your feature would solve.
- Be open to discussion — the feature may already be planned or there may be alternative approaches.

## Translation / Localization

Streamarr uses `react-intl` for internationalization. To contribute translations:

1. Extract the latest English strings:

   ```bash
   yarn i18n:extract
   ```

2. Translation files are located in `src/i18n/locale/`.

3. Add or update the appropriate locale file and submit a PR.

## Need Help?

- Check our [documentation](https://docs.streamarr.dev).
- Open a [GitHub Discussion](https://github.com/nickelsh1ts/streamarr/discussions).
- Review the [API docs](http://localhost:3000/api-docs) (available when running locally).

## License

By contributing to Streamarr, you agree that your contributions will be licensed under the [MIT License](LICENSE).
