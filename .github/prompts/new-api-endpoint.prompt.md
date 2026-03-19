---
description: 'Scaffold a new API endpoint: OpenAPI spec → route → registration → types'
argument-hint: "Describe the endpoint (e.g., 'GET /api/v1/stats/overview returning server statistics')"
agent: 'agent'
tools: [read, edit, search]
---

Create a new API endpoint following the Streamarr conventions. Work through these steps in order:

## Steps

1. **Define in OpenAPI spec**: Add the path and schema to [streamarr-api.yml](../../streamarr-api.yml). Include request/response schemas under `components/schemas` if needed.

2. **Create or update the route file**: Add the handler in `server/routes/`. Follow existing patterns:
   - Use `getRepository(Entity)` from `@server/datasource` for DB access
   - Add `isAuthenticated(Permission.X)` middleware as appropriate
   - Type the handler: `router.get<TParams, TResponse>(...)`

3. **Register the route**: If this is a new route file, import and mount it in [server/routes/index.ts](../../server/routes/index.ts) with the correct permission middleware.

4. **Add TypeScript types**: Define request/response interfaces in `server/interfaces/api/` if they don't already exist.

5. **Validate**: Run `yarn typecheck:server` to confirm no type errors.

## Reference

- Existing routes: `server/routes/`
- API spec: `streamarr-api.yml`
- Permissions: `server/lib/permissions.ts`
- Route registration: `server/routes/index.ts`
