# Dependency Scanning and Security Gate (Task 12)

**Author:** Kaushik Shettigar
**Workflow:** `.github/workflows/ci.yml`

## 1. Objective

Scan the application's dependencies for known vulnerabilities in the CI pipeline and fail the pipeline when critical vulnerabilities are found.

## 2. Tool

**`npm audit`**, integrated into the existing CI workflow.

## 3. How it works

1. The workflow generates a JSON report:

   ```bash
   npm audit --json > npm-audit-report.json || audit_exit=$?
   ```

   `npm audit` exits non-zero when it finds any vulnerability, so the exit code is captured instead of stopping the step. The report stays available for the gate step.

2. A Node.js script reads `npm-audit-report.json`, counts findings by severity and applies the gate:

   ```javascript
   const critical = counts.critical ?? 0;
   if (critical > 0) process.exit(1);
   ```

3. The workflow uploads `npm-audit-report.json` as a build artifact, **even when the gate fails**, so the report is available for review.

## 4. Threshold

| Severity | Effect on pipeline |
|---|---|
| Critical | **Fails the pipeline** |
| High, medium, low | Reported in the log and artifact, but do not fail this gate on their own |

Critical-only was chosen to block clearly dangerous dependencies without blocking every build on lower-severity findings. The threshold can be tightened later (for example, to include high severity).

## 5. Results

- **Normal run:** the scan completed, the gate reported no critical vulnerabilities, and the pipeline passed. The report was uploaded as the `npm-audit-report` artifact.
- **Gate test (failure evidence):** a test-only run (branch `test/critical-vulnerability-gate`) simulated a critical vulnerability. The `Fail if critical vulnerabilities are found` step failed with exit code 1, and the report artifact was still uploaded. This proves the gate blocks a critical finding.

## 6. Delivery

- [PR #15 — Add dependency vulnerability scanning to CI](https://github.com/coshik/devops-ai-masters-capstone/pull/15)
- Merge commit into `develop`: `06518943b9c10e71aa44d207d086c3d012421221`

The gate is in the `develop` workflow and reaches `main` with the next `develop` → `main` promotion.

## 7. Relationship to Task 13

Task 12 covers **application dependencies** (npm packages) at build time. Task 13 covers **container image** packages (Alpine OS layer) after the image is pushed. See [container-image-scan.md](container-image-scan.md) for the image scan and remediation of CVE-2026-85091.

## 8. Evidence

- `docs/evidence/task12-1-ci-vuln-scan-success-run.png` — successful CI run with the audit report artifact
- `docs/evidence/task12-2-scan-log-no-critical-found.png` — scan log showing no critical vulnerabilities
- `docs/evidence/task12-3-simulated-critical-fails-pipeline.png` — gate failing on the simulated critical vulnerability
