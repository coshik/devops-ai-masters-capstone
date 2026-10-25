# CI/CD Pipeline (Tasks 2, 3 and 4)

**Author:** Kaushik Shettigar
**Workflows:** `.github/workflows/ci.yml`, `.github/workflows/cd.yml`

## 1. Continuous integration (Task 2)

`ci.yml` runs on pushes and pull requests. It uses Node.js 22 and performs:

1. Dependency installation (`npm ci`)
2. Unit tests (`npm test`)
3. Lint checks (`npm run lint`)
4. Build (`npm run build`) and build-output verification
5. A dependency audit that fails on critical vulnerabilities (see [security/dependency-scanning.md](security/dependency-scanning.md))

## 2. Continuous delivery (Task 3) and multi-stage pipeline (Task 4)

`cd.yml` is a single pipeline with three stages. It starts on every push to `main` and can also be started manually.

| Stage | GitHub environment | What it does |
|---|---|---|
| **Dev - Build and Test** | `development` | Installs dependencies, runs tests, lint and build, and builds the Docker image |
| **Test - Validate Image and Application** | `testing` | Reinstalls and re-tests, validates the Dockerfile with a build, and checks that the health endpoint exists in the code |
| **Prod - Deploy to Amazon EKS** | `production` | Assumes an AWS role through OIDC, logs in to ECR, builds and pushes the commit-tagged image and `latest`, configures `kubectl`, deploys to EKS and verifies the rollout |

Each stage runs only if the previous one succeeds (`needs:`).

**Manual approval.** The `production` environment requires a reviewer. The pipeline pauses before the production stage until it is approved.

**Deployment.** The production job replaces the image in `k8s/deployment.yaml` with the commit-specific tag, applies the Deployment and Service with `kubectl`, and then waits for `kubectl rollout status` to succeed.

## 3. Environment-specific variables

Each GitHub environment defines its own variables, which the matching job reads through `vars.`:

| Environment | `APP_ENV` | `LOG_LEVEL` |
|---|---|---|
| `development` | `development` | `debug` |
| `testing` | `testing` | `info` |
| `production` | `production` | `warn` |

Every job starts with a step, **Show environment configuration**, that prints its values and adds them to the run summary. The run summary therefore shows a different environment and log level for each stage.

## 4. Authentication

The pipeline uses OpenID Connect to assume an IAM role, so no AWS keys are stored in GitHub. See [secrets-management.md](secrets-management.md) for how the production job also reads a secret.

## 5. Evidence

- Task 2: `task02-1-pr-ci-pipeline.png`, `task02-2-ci-success.png`
- Task 3: `task03-1` to `task03-4` (deployment, run, approval)
- Task 4: `task04-1` to `task04-4` (multi-stage run, approval, health check) and `task04-5-env-variables.png` (environment values in the run summary)

All files are in `docs/evidence/`.
