---
description: 'Use when editing Express API routes, creating new endpoints, or working with backend request/response handling. Covers route patterns, auth, OpenAPI, and database access.'
applyTo: 'server/routes/**'
---

# Backend API Conventions

## Route Structure

- Export a `Router()` as default export
- Register in `server/routes/index.ts` with appropriate `isAuthenticated(Permission.X)` middleware
- Define the endpoint in `streamarr-api.yml` **before** implementing — runtime validation rejects undefined routes

## Auth & Permissions

- `req.user` is always available (populated by global `checkUser` middleware)
- Use `isAuthenticated()` for logged-in users, `isAuthenticated(Permission.ADMIN)` for permission-gated routes
- Permission flags: `server/lib/permissions.ts` — check with `user.hasPermission([Permission.X])`

## Database

- Always: `getRepository(Entity)` from `@server/datasource`
- Never: instantiate repositories directly or import `AppDataSource`
- Business logic belongs in entity static/instance methods, not route handlers

## Patterns

- Async handlers with try/catch — return appropriate HTTP status codes
- Validate parameters before database access
- Use `logger.error('...', { label: 'RouteName' })` for error logging
- Type route handlers: `router.get<TParams, TResponse>(...)`
