---
description: 'Use when editing Express API routes, creating new endpoints, or working with backend request/response handling. Covers route patterns, auth, OpenAPI, and database access.'
applyTo: 'server/routes/**'
---

# Backend API Conventions

## Route Structure

- Export a `Router()` as default export
- Register in `server/routes/index.ts` with appropriate `isAuthenticated(...)` middleware at the route or mounted-router boundary. Inspect the mount before adding a duplicate guard to a router that is already protected.
- Define the endpoint in `streamarr-api.yml` **before** implementing — runtime validation rejects undefined routes

## Auth & Permissions

- Global `checkUser` middleware runs on all requests and populates `req.user` when a valid session/API key is present; otherwise `req.user` is `undefined`. Use `isAuthenticated(...)` on routes that require a logged-in user to guarantee `req.user` is set.
- Use `isAuthenticated()` for logged-in users, `isAuthenticated(Permission.ADMIN)` for permission-gated routes. A router-level guard is sufficient for every route below that mount.
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
- Keep GET endpoints read-only; split sync/toggle mutations into POST/PUT/PATCH/DELETE endpoints.
- Map external service failures and local persistence failures to distinct statuses/messages. Do not report disk/settings errors as upstream connectivity failures.
- When a route changes the settings singleton, preserve the previous value until persistence succeeds or restore it on failure. Existing settings routes are a known exception; refactor their rollback when future work already touches the route, without expanding unrelated scope.
- Check all internal and frontend consumers before changing an endpoint. Update the OpenAPI spec, callers, error feedback, and user docs together when applicable.
