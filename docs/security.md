# Security Overview

**Author:** Kaushik Shettigar

This document summarizes the security controls in the capstone, what each one covers, and what is not implemented. Detailed write-ups are linked.

## 1. Controls by layer

| Layer | Control | Detail |
|---|---|---|
| Source control | Branch rulesets | `main` and `develop` require pull requests and block force pushes ([branching-strategy.md](../branching-strategy.md)) |
| CI pipeline | Dependency audit gate | `npm audit` runs in CI and fails the pipeline on critical vulnerabilities. The report is uploaded as an artifact even on failure ([security/dependency-scanning.md](security/dependency-scanning.md)) |
| CD pipeline | OIDC authentication | GitHub Actions assumes an IAM role with short-lived credentials, so no AWS keys are stored |
| CD pipeline | Production approval | The production stage waits for manual approval through the GitHub `production` environment |
| Container image | Hardened Dockerfile | Node.js 22 Alpine, production-only dependencies, `NODE_ENV=production`, non-root `node` user, and a `.dockerignore` that keeps non-image files out of the build context |
| Container image | Registry scanning and lifecycle | ECR image scanning, plus a lifecycle policy that expires untagged and old images ([cost-optimization.md](cost-optimization.md)) |
| Secrets | Secrets Manager and IRSA | The pods read one secret through a service account whose IAM policy is limited to that secret's ARN. `/secret-status` never returns the secret value |
| Detection | Alarms and logs | CPU and memory alarms to SNS, centralized logs with 7-day retention, EKS control-plane audit logs ([monitoring.md](monitoring.md), [logging.md](logging.md)) |

## 2. Vulnerability findings and remediation

**Dependencies (Task 12).** The CI gate blocks critical vulnerabilities. A test-only run with a simulated critical finding proved the gate fails the pipeline.

**Container image (Task 13).** The initial ECR scan on 17 October 2026 found one high-severity vulnerability, **CVE-2026-85091** in the Alpine package `zlib-1.3.2-r0`, in both the deployed image and `latest`. The Dockerfile now upgrades Alpine packages at build time (`apk update && apk upgrade --no-cache`), which moved the package to `zlib-1.3.2-r1`. A separately tagged image built from it scanned with zero findings in every severity category ([security/container-image-scan.md](security/container-image-scan.md)).

## 3. Operational security practices

- No secrets, credentials or tokens are committed. Screenshots are checked for them before upload.
- Failures in the troubleshooting tasks were deliberate and are documented as such.
- The unused NAT gateway and its Elastic IP were removed, reducing unused infrastructure.

## 4. Known limitations and next steps

These controls from the assignment's security flow are **not implemented**:

| Gap | Possible next step |
|---|---|
| Static code analysis (SonarQube or Snyk) | Add a SAST step to CI |
| Secret detection in commits | Add a secret scanner such as gitleaks to CI |
| Image signing | Sign images in the pipeline and verify before deploy |
| Infrastructure-as-code scanning | Run Checkov or tfsec on the Terraform |
| Kubernetes network policies | Enable network policy enforcement in the VPC CNI, then add default-deny policies |
| Runtime threat detection (Falco) | Deploy Falco or use GuardDuty EKS protection |

Other limitations:

- The `CloudWatchAgentServerPolicy` was attached to the shared node role, so every pod on the nodes inherits it. A dedicated IRSA role for the CloudWatch agent would be tighter.
- The worker nodes have public IP addresses and rely on security groups for protection.
- The node security group allows all outbound traffic.
- The dependency gate fails only on critical findings, so high-severity findings are reported but do not block the build.
