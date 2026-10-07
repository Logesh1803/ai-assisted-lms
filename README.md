
# AI-Assisted Learning Management System (LMS)

A modern, modular **Learning Management System (LMS)** built using a **monorepo architecture**.  
This repository combines frontend, backend, background workers, and shared libraries into a single cohesive workspace designed for scalability, maintainability, and real-world product development.

The system focuses on:
- Role-based authentication and authorization
- Course and enrollment management
- Clean domain separation
- Optional AI-assisted learning features
- Cloud-ready deployment

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router)
- **Backend:** NestJS 11
- **State Management:** Zustand
- **ORM:** Prisma 7.0.0
- **Monorepo Tooling:** Turborepo 2.6.1
- **Package Manager:** Yarn 4.11.0
- **Database:** PostgreSQL
- **CI/CD:** Azure DevOps Pipelines

---

## Repository Structure

This repository is organized as a **single monorepo** with shared configuration, dependencies, and tooling.

```txt
.
├── apps/
│   ├── api/                   # Backend API (Auth, Courses, Enrollments, Quiz, AI)
│   ├── web/                   # Frontend application (Next.js)
│   └── worker/                # Background jobs (emails, video processing)
│
├── libs/                      # Shared backend libraries
│   ├── data-sources/          # Database & Prisma setup
│   ├── message-queues/        # BullMQ queue abstractions
│   ├── notifications/         # Email channel and templates
│   └── utils/                 # Dates, encryption, OTP, env loading
│
├── cloudflared/               # Tunnel configuration
├── nginx/                     # Reverse-proxy configuration
├── scripts/                   # Utility and automation scripts
│
├── deploy.sh                  # Deployment script
├── ecosystem.config.js        # PM2 process definitions
├── nest-cli.json              # Global NestJS configuration
├── turbo.json                 # Turborepo pipeline configuration
├── tsconfig.json              # Global TypeScript configuration
├── package.json               # Root workspace configuration
├── yarn.lock                  # Single lockfile
└── README.md
```

---

## Environment Configuration

* **Backend services (NestJS apps and libraries)**
  Use a single shared `.env` file at the repository root.

* **Frontend applications (Next.js)**
  Maintain separate `.env` files per frontend app.

This approach keeps backend configuration consistent while allowing frontend flexibility.

---

## Getting Started

### Prerequisites

* Node.js **>= 18**
* Yarn **4.11.0**

### Install Yarn

```bash
npm i -g corepack
corepack enable
corepack prepare yarn@4.11.0 --activate
```

Verify installation:

```bash
yarn --version
```

---

## Install Dependencies

From the repository root:

```bash
yarn install
```

---

## Database & Prisma Setup

The `system` datasource is the only one in the repository.

```bash
yarn prisma:system:generate   # regenerate the typed client
yarn prisma:system:push       # push the schema to the database
yarn prisma:system:deploy     # apply migrations (used in deployment)
```

`SYSTEM_DATABASE_URL` must be set for any of these to run.

---

## Running the Workspace

```bash
yarn dev       # Run all apps in development mode
yarn build     # Build all applications
yarn start     # Start backend services
```

> **Note:**
> The frontend uses **Next.js Standalone Mode**, so `yarn start` does not start the web application.

---

## Testing

Unit tests cover the pure logic — scoring, progress, and the AI JSON repair —
so they run in under a second with no database, network, or AI key.

```bash
yarn test                   # every workspace (51 tests)
yarn workspace api test     # API logic tests only
yarn workspace web test     # shared web helper tests only
```

Tests live next to the code they cover, as `*.spec.ts`:

| File | Covers |
| --- | --- |
| `apps/api/src/quiz/quiz-scoring.spec.ts` | Quiz marking rules, strong/weak topics |
| `apps/api/src/enrollment/enrollment-progress.spec.ts` | Course completion percentage |
| `apps/api/src/gemini/json-repair.spec.ts` | Repairing malformed JSON from Gemini |
| `apps/web/lib/utils.spec.ts` | Date, duration, initials and avatar helpers |

Both Jest configs pin `TZ=UTC`, so date formatting asserts identically on every
machine and in CI.

End-to-end tests sit behind their own `test:e2e*` scripts. Playwright has no
config or specs in the repository yet, so those scripts are placeholders —
`yarn test` deliberately does not run them.

---

## Code Conventions

* **Shared libraries are imported through their alias**, never a deep path:

  ```ts
  import { getTimestamps } from '@thinkbloom/utils';          // yes
  import { getTimestamps } from 'utils/src/date-formatter.service'; // no
  ```

  The aliases are `@thinkbloom/data-sources`, `@thinkbloom/utils`,
  `@thinkbloom/message-queues` and `@thinkbloom/notifications`, declared in the
  root `tsconfig.json` and mirrored in each app's own `tsconfig.json`.

* **Names are spelled out.** `enrollment`, not `e`; `lesson`, not `l`;
  `question`, not `q`. Loop counters use `index`, not `i`.

* **The database service is injected as `prisma`** in every service.

* **Query parameters use a DTO**, not `any`, so `class-validator` can check
  them. See `apps/api/src/course/dto/query-course.dto.ts`.

* **Prefer letting the database count.** Use `count()` or a filtered `_count`
  rather than loading rows to read `.length` — lesson rows carry full markdown
  bodies.

* **Look values up through a `Map`** when matching two lists, rather than
  calling `.find()` inside a loop.

* Section headers use the `// ─── Title ───` banner style.

* **API responses are typed.** `apps/web/lib/types.ts` describes what each
  endpoint returns and `apps/web/lib/api.ts` is typed against it, so pages get
  real types instead of `any`. Two things to remember when adding an endpoint:

  * Field names stay as they are in the database — `created_at`, not
    `createdAt`. Only a handful of endpoints reshape their output, and those
    say so in the type.
  * Timestamps are `BigInt` columns and `BigInt.prototype.toJSON` stringifies
    them, so they arrive as **strings** of milliseconds.

* **`yarn lint` reports; `yarn lint:fix` rewrites.** Linting no longer edits
  files as a side effect of checking them.

Both are clean:

```bash
yarn lint    # 0 errors across api, worker and web
yarn test    # 51 tests
```

---

## Known Gaps

* **Teacher → Students → per-lesson progress** shows its empty state. The panel
  reads `enrollment.lesson_progress`, but `GET /enrollments/course/:uuid`
  includes only the student relation. Adding `lesson_progress` (with the lesson
  title) to that endpoint's `select` would light the panel up.

* **`<img>` over `next/image`.** Eight lint warnings suggest `next/image`.
  Course thumbnails come from arbitrary remote URLs, so switching would mean
  configuring `images.remotePatterns` first.

* **Playwright** is a dependency but has no config or specs. `test:e2e*` are
  placeholders.

---

## Development Guidelines

### Adding a New Backend Application

Create a new NestJS app inside `apps/`:

```bash
nest new <app-name>
```

All applications must:

* Extend the global TypeScript configuration
* Follow shared path alias conventions
* Use the common build and runtime setup

---

### Adding a New Backend Library

Generate a library from the repository root:

```bash
nest g library <lib-name>
```

All libraries:

* Live under `libs/`
* Share the global TypeScript baseline
* Are consumed via workspace path aliases

---

## AI-Assisted Features

AI functionality is implemented as an **optional enhancement layer**, designed to support learning without tightly coupling it to the core LMS.

Examples include:

* AI-generated course summaries
* Simplified explanations for lesson content
* Instructor assistance tools

The LMS remains fully functional even without AI enabled.

---

## Design Principles

* **Modularity:** Clear separation of domains and responsibilities
* **Scalability:** Monorepo with consistent tooling and configuration
* **Simplicity:** Avoid unnecessary over-engineering
* **Extensibility:** Features can be added without major refactoring

---

## License

This project is currently private.
Licensing information will be added if the project is open-sourced in the future.

```
```
