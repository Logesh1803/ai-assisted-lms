
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
├── .yarn/                     # Yarn configuration and releases
├── apps/
│   ├── api/                   # Backend API (Auth, Courses, Enrollments)
│   ├── web/                   # Frontend application (Next.js)
│   └── worker/                # Background jobs (emails, async tasks, AI jobs)
│
├── libs/                      # Shared backend libraries
│   ├── data-sources/          # Database & Prisma setup
│   ├── env-loader/            # Centralized environment handling
│   └── message-queues/        # Queue abstractions (optional, future use)
│
├── docs/                      # Architecture and technical documentation
├── infrastructure/            # Deployment and cloud-related configs
├── scripts/                   # Utility and automation scripts
│
├── .env.example               # Backend environment variables
├── nest-cli.json              # Global NestJS configuration
├── turbo.json                 # Turborepo pipeline configuration
├── tsconfig.json              # Global TypeScript configuration
├── package.json               # Root workspace configuration
├── yarn.lock                  # Single lockfile
└── README.md
````

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

```bash
yarn prisma:firm:push
yarn prisma:firm:generate

yarn prisma:system:push
yarn prisma:system:generate
```

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
