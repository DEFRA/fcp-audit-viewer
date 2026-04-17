# FCP Audit Viewer - AI Coding Agent Instructions

## Overview

Authenticated viewer interface for FCP Audit. Server-side rendered Node.js application using Hapi.js with Nunjucks templates and OIDC/JWT authentication.

## Architecture

### Service Communication
- Calls backend API via `AUDIT_ENDPOINT` env var (path: `/api/v1/audit`)
- **Authentication:** Microsoft Entra (Azure AD) OIDC with JWT tokens
- **Session Management:** Redis (via `@hapi/catbox-redis`) or memory cache
- Sibling service: [fcp-audit](../fcp-audit) (API interface)

### Core Technology Stack
- **Runtime:** Node.js 22+ with ES modules (`"type": "module"`)
- **Framework:** Hapi.js 21 for HTTP server
- **Authentication:** `@hapi/bell` (OIDC), `@hapi/jwt` (token validation)
- **Templates:** Nunjucks for server-side rendering
- **Bundling:** Webpack for client-side assets
- **Testing:** Vitest with separate unit/integration directories
- **Linting:** Neostandard (modern ESLint config)
- **Config:** Convict for environment-based configuration

## Code Quality Standards

### Linting Requirements
**All code MUST pass neostandard linting before commit.**

Run linting:
```bash
npm run lint              # Check for errors
npm run lint:fix          # Auto-fix issues
```

**Common neostandard rules to follow:**
- ❌ No unused variables or imports
- ❌ No unnecessary whitespace or blank lines
- ✅ Use `const` for variables that don't change
- ✅ Consistent 2-space indentation
- ✅ Single quotes for strings (except when escaping)
- ✅ No semicolons (JavaScript ASI)
- ✅ Trailing commas in multiline objects/arrays

**When generating code:**
1. Follow existing code style in the file
2. Run linter after making changes
3. Fix all linting errors before completion
4. Never commit code with linting errors

## Standards & Guidelines

This service follows:
- **[GOV.UK Service Standard](https://www.gov.uk/service-manual/service-standard)** - Best practices for building government services
- **[GOV.UK Design System](https://design-system.service.gov.uk/)** - Design patterns, components, and styles
- **[DEFRA Software Development Standards](https://defra.github.io/software-development-standards/)** - Team coding standards and practices
- **[WCAG 2.2](https://www.w3.org/TR/WCAG22/)** - Web accessibility guidelines (Level AA minimum)

## Project Structure

```
src/
  server.js         # Hapi server setup, plugin registration, security config
  index.js          # Entry point
  auth/             # OIDC authentication logic and token management
  config/           # Convict configuration schemas
  plugins/          # Hapi plugins (router, auth, CSRF, cookies)
  routes/           # Route definitions with auth requirements
  views/            # Nunjucks templates
  api/              # Backend API integration
  common/helpers/   # Utilities (logging, tracing)
  client/           # Client-side JavaScript
```

## Development Patterns

### Authentication
Routes require authentication by default. Opt-out for public routes:

```javascript
export const publicRoute = {
  method: 'GET',
  path: '/health',
  options: {
    auth: false  // Explicitly disable auth
  },
  handler: (request, h) => { /* ... */ }
}
```

Authenticated routes have access to user session:
```javascript
handler: async (request, h) => {
  const userId = request.auth.credentials.userId
  // Access JWT claims, user info
}
```

### OIDC Configuration
Authentication logic in [src/auth](../src/auth):
- `get-oidc-config.js` - OIDC provider configuration
- `verify-token.js` - JWT token validation
- `refresh-tokens.js` - Token refresh logic
- `state.js` - OAuth state parameter handling

### Route Definition
Similar to frontend but with auth context:

```javascript
export const adminRoute = {
  method: 'GET',
  path: '/admin/resource',
  // auth: 'jwt' is default, can be omitted
  handler: async (request, h) => {
    return h.view('admin-template', { 
      user: request.auth.credentials 
    })
  }
}
```

### Session Management
- Redis cache in production (`@hapi/catbox-redis`)
- Memory cache in local dev (`@hapi/catbox-memory`)
- Session cookies via `@hapi/cookie` plugin
- Configuration in [src/config/config.js](../src/config/config.js)

## Development Workflow

### Local Development (Standalone)
```bash
npm install
npm run docker:build
npm run docker:dev           # Runs on port 3006
```

**Note:** Entra authentication requires environment configuration:
- `ENTRA_WELL_KNOWN_URL` - Entra OIDC discovery URL
- `ENTRA_CLIENT_ID` - OAuth client ID
- `ENTRA_CLIENT_SECRET` - OAuth client secret


### Testing
```bash
npm run docker:test          # Run all tests with coverage
npm run docker:test:watch    # TDD mode
```
- Mock OIDC flows in tests
- Use `server.inject()` with auth credentials
- Tests in `test/unit/**/*.test.js` and `test/integration/**/*.test.js`

### Debugging
```bash
npm run dev:debug            # Debugger listening on 0.0.0.0:9229
```

## Component Integration

### Calling Backend API
- Backend audit endpoint: `AUDIT_ENDPOINT` + `/api/v1/audit`
- Handle token expiration and refresh
- Use helpers in [src/api](../src/api)

### Client-Side Assets
- Source: [src/client](../src/client)
- Webpack bundles to `.public/` directory
- GOV.UK Frontend components for consistent styling

## Testing Guidelines

### Unit Tests
- Mock authentication (bypass OIDC in tests)
- Mock backend API calls
- Test route handlers, services, auth logic in isolation
- Example: [test/unit](../test/unit)

### Integration Tests
- Use test credentials or mock OIDC provider
- Test full authenticated request cycles
- Verify session handling
- Example: [test/integration](../test/integration)

### Authentication Testing Pattern
```javascript
const authCredentials = {
  sessionId: 'test-session-id',
  scope: ['Audit.View'],
  token: 'mock-jwt-token'
}

const response = await server.inject({
  method: 'GET',
  url: '/audit',
  auth: { strategy: 'entra', credentials: authCredentials }
})
```

## CI/CD

### GitHub Actions
- [.github/workflows/publish.yml](../.github/workflows/publish.yml) - Main branch builds
- Runs `npm run docker:test` and SonarQube scan
- Deploys to CDP (Defra Cloud Platform)
- Requires OIDC configuration in CDP environments

### Environment-Specific Config
Key differences between environments:
- **Local:** Memory cache, mock OIDC (optional)
- **Dev/Test:** Redis cache, test OIDC provider
- **Production:** Redis cache, production OIDC provider

## Common Tasks

### Adding an Authenticated Route
1. Create route file in `src/routes/` (auth enabled by default)
2. Access user credentials via `request.auth.credentials`
3. Register in [src/plugins/router.js](../src/plugins/router.js)
4. Add corresponding Nunjucks template in `src/views/`
5. Add tests with mocked authentication

### Adding Authorization Checks
Add scope/role validation in route options:
```javascript
options: {
  auth: {
    strategy: 'entra',
    scope: ['Audit.View']
  }
}
```

### Handling Token Refresh
- Token refresh logic in [src/auth/refresh-tokens.js](../src/auth/refresh-tokens.js)
- Automatic refresh on expired token responses
- Fallback to re-authentication if refresh fails

### Updating OIDC Configuration
1. Update schemas in [src/config/config.js](../src/config/config.js)
2. Modify [src/auth/get-oidc-config.js](../src/auth/get-oidc-config.js) if needed
3. Test with mock provider locally
4. Coordinate with identity provider team for production changes

## Security Considerations

- **CSRF Protection:** `@hapi/crumb` plugin enabled
- **Session Security:** HTTPOnly, Secure cookies in production
- **Token Validation:** Verify JWT signatures, expiration, issuer
- **CSP:** Content Security Policy headers configured
- **Rate Limiting:** Consider adding for production (not currently implemented)

## Differences from Public Frontend

| Aspect              | Viewer                         | Frontend (Public)           |
|---------------------|--------------------------------|-----------------------------|
| Authentication      | Entra OIDC/JWT required        | None (public access)        |
| Session             | Redis/memory cache             | Cookie-based only           |
| Backend Access      | Audit query endpoints          | Public endpoints only       |
| User Context        | `request.auth.credentials`     | N/A                         |
| Deployment          | Restricted access              | Public internet             |
