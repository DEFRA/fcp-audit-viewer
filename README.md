# fcp-audit-viewer

![Build](https://github.com/defra/fcp-audit-viewer/actions/workflows/publish.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-audit-viewer&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-audit-viewer)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-audit-viewer&metric=bugs)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-audit-viewer)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-audit-viewer&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-audit-viewer)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-audit-viewer&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-audit-viewer)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-audit-viewer&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-audit-viewer)
[![Dependabot](https://badgen.net/github/dependabot/DEFRA/fcp-audit-viewer)](https://github.com/DEFRA/fcp-audit-viewer/security/dependabot)

Authenticated viewer interface for querying and browsing audit events from the FCP Audit service. OIDC authentication via Microsoft Entra.

## Requirements

### Docker

This application is intended to be run in a Docker container to ensure consistency across environments.

Docker can be installed from [Docker's official website](https://docs.docker.com/get-docker/).

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

Build the Docker container:

```
npm run docker:build
```

Run the application in `development` mode:

```bash
npm run docker:dev
```

### Testing

Tests **must** be run using Docker as configuration is applied via Docker Compose:

```bash
npm run docker:test
```

Tests can also be run in watch mode to support Test Driven Development (TDD):

```bash
npm run docker:test:watch
```

> Do not run `npm test` directly — environment configuration is only set correctly when running via Docker.

### Outbound proxy tests

In CDP all outbound traffic must go through a Squid proxy. The service uses Node.js native proxy support
(`NODE_USE_ENV_PROXY`), which only applies to the global HTTP agents. `@hapi/wreck` (used directly, and by
`@hapi/bell` and `@hapi/jwt`) creates its own agents, so `setupProxy()` points Wreck at the global agents.

`compose.proxy.yml` extends the test setup with a Squid proxy (configured by `test/proxy/squid.conf`). The service,
Redis and Floci sit on an internal network with no route out, so any request that bypasses the proxy fails rather
than silently succeeding.

The service fetches the Entra OIDC config on startup and exits if startup fails. `npm run docker:test:proxy` starts
the service and waits for its `/health` healthcheck, so it passes only if that lookup succeeded through the proxy.
On failure the service logs are printed, and the stack is torn down either way.

```bash
# requires internet access to login.microsoftonline.com
npm run docker:test:proxy
```

The following must be set in CDP environments (via cdp-app-config), or the service fails config validation at startup:

| Variable | Description |
|----------|-------------|
| `NODE_USE_ENV_PROXY` | Enables Node.js native proxy support for `HTTPS_PROXY`/`NO_PROXY`, must be `1` |
| `HTTPS_PROXY` | Outbound proxy URL for HTTPS requests |
| `NO_PROXY` | Hosts that bypass the outbound proxy, e.g. SNS |

### npm scripts

All available npm scripts can be seen in [package.json](./package.json)
To view them in your command line:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

## SonarQube Cloud

Instructions for setting up SonarQube Cloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
