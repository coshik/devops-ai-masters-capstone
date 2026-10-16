# DevOps with AI Masters Program - Capstone Project

## Project Status

🚧 **Project in progress**

Tasks 1–8 have implementation and verification work documented below. The remaining work includes the DevSecOps, Observability, Troubleshooting, and Cost Optimization phases; the capstone is not yet complete.

## About

This repository contains my individual capstone project for the DevOps with AI Masters Program.

The project covers:

1. Source Control & Collaboration
2. CI/CD Pipelines
3. Infrastructure as Code (Terraform)
4. Containerization & Kubernetes
5. DevSecOps
6. Observability
7. Troubleshooting
8. Cost Optimization

## Project Approach

The project is implemented individually using AWS cloud infrastructure and DevOps tools. Changes are developed on feature branches, validated with GitHub Actions, and merged through pull requests. The README records implementation choices, validation commands, and known scope limitations.

## Implemented Work

### Task 1 — Source Control & Collaboration

- Established a branching strategy: `main` for production, `develop` for integration, and `feature/*` branches for individual changes.
- Configured GitHub rulesets for `main` and `develop` to require pull requests and block force pushes.
- Used feature-to-develop and develop-to-main pull requests to promote validated changes.

### Task 2 — CI Pipeline

- Added the Node.js application and automated tests for the root route and `/health` endpoint.
- Added the GitHub Actions workflow at `.github/workflows/ci.yml`.
- The workflow uses Node.js 22 and runs dependency installation, tests, lint checks, build verification, and build-output checks on relevant pushes and pull requests.
- CI was verified successfully for the implementation pull request.

### Task 3 — Continuous Deployment to AWS

- Containerized the Node.js application and deployed it to Amazon Elastic Kubernetes Service (EKS).
- Created the ECR repository `devops-ai-masters-capstone` in `ap-south-1`.
- Configured GitHub Actions to authenticate to AWS using OpenID Connect (OIDC) and an IAM role rather than long-lived AWS access keys.
- Deployed Kubernetes manifests and verified the application through its LoadBalancer service and `/health` endpoint.

### Task 4 — Multi-Stage CI/CD Pipeline

- Implemented the workflow at `.github/workflows/cd.yml` with Dev, Test, and Prod stages.
- The pipeline builds and validates the application image, pushes commit-specific and `latest` tags to ECR, and deploys the selected image to EKS.
- Configured a production environment approval gate before the production deployment.
- Verified the workflow and approved the production deployment during implementation.

### Task 5 — Infrastructure as Code (Terraform)

- Added Terraform configuration and usage notes under `terraform/`.
- Used Terraform data sources to discover existing infrastructure, including the EKS cluster `devops-ai-capstone`, managed node group `capstone-ng`, VPC/subnets, and relevant IAM roles.
- Added CloudWatch logging configuration for the EKS control-plane log group `/aws/eks/devops-ai-capstone/cluster` with seven-day retention.
- Enabled EKS control-plane logging for API, audit, authenticator, controller manager, and scheduler events during implementation.
- Ran Terraform formatting/validation and reviewed the plan before applying the intended CloudWatch log group change.

**Scope note:** the VPC, EKS cluster, node group, and IAM roles already existed and are referenced by data sources; this configuration does not create or fully manage those existing resources. Review Terraform plans carefully before applying changes.

### Task 6 — AWS Secrets Manager and IRSA

- Integrated the AWS Secrets Manager SDK into the Node.js application.
- Configured IAM Roles for Service Accounts (IRSA) so the Kubernetes service account `devops-ai-capstone` can retrieve only the designated application secret.
- Restricted the IAM policy to the specific Secrets Manager secret ARN rather than granting broad secret access.
- Added `/secret-status`, which reports whether configuration is available without returning the secret value.
- Added automated tests covering the normal routes and secret-status success/failure behavior.
- Verified `npm test`, `npm run lint`, and `npm run build`, then verified the CD workflow and the live `/secret-status` response.

**Security note:** secret values, AWS credentials, tokens, and other sensitive values must never be committed to this repository or included in screenshots.

### Task 7 — Dockerization and Amazon ECR

- Hardened the production `Dockerfile` using Node.js 22 Alpine, production-only dependency installation, `NODE_ENV=production`, and the non-root `node` user.
- Added `.dockerignore` to exclude Git metadata, local dependencies, test output, Terraform and Kubernetes files, screenshots, and other non-image files from the Docker build context.
- Built the application image and pushed it to Amazon Elastic Container Registry (ECR).

**ECR repository:** `288761772142.dkr.ecr.ap-south-1.amazonaws.com/devops-ai-masters-capstone`

**AWS Region:** `ap-south-1`

The manually verified `latest` image push on 2026-10-15 returned this digest:

`sha256:aa161a0d7939046663ed8ac3e19cab9c779b86b5aaae85195267d0d05d658696`

The running EKS Deployment was observed using a commit-specific image tag. Pushing `latest` does not by itself mean that this manually pushed image is running in the cluster.

Build and push commands:

```bash
docker build -t devops-ai-masters-capstone:latest .
ECR=288761772142.dkr.ecr.ap-south-1.amazonaws.com/devops-ai-masters-capstone
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  288761772142.dkr.ecr.ap-south-1.amazonaws.com
docker tag devops-ai-masters-capstone:latest "$ECR:latest"
docker push "$ECR:latest"
```

Verify the published image tag and digest:

```bash
aws ecr describe-images \
  --repository-name devops-ai-masters-capstone \
  --region ap-south-1 \
  --image-ids imageTag=latest \
  --query 'imageDetails[0].[imageTags,imageDigest,imagePushedAt]' \
  --output json
```

### Task 8 — Kubernetes Deployment, Service, and Probes

Kubernetes manifests are maintained in `k8s/`:

- `k8s/deployment.yaml`: Deployment with two replicas and HTTP readiness/liveness probes against `/health` on port `3000`.
- `k8s/service.yaml`: LoadBalancer Service exposing port `80` and forwarding to container port `3000`.
- The Deployment uses the IRSA-backed service account and sets the AWS region and secret ARN as environment variables.

Verification commands:

```bash
kubectl rollout status deployment/devops-ai-capstone
kubectl get pods -o wide
kubectl get deployment devops-ai-capstone
kubectl get service devops-ai-capstone
kubectl describe deployment devops-ai-capstone
curl -i http://<load-balancer-dns>/health
curl -i http://<load-balancer-dns>/secret-status
```

**Observed verification:** the rollout succeeded; both pods were `1/1 Running` with zero restarts; the Deployment reported `2/2` available; the Service had an external LoadBalancer DNS name; and readiness/liveness probes were present. The `/health` and `/secret-status` endpoints were checked successfully during the session.

## Evidence & Screenshots

Screenshots are maintained locally in the phase-based folder structure and are not assumed to be committed to this repository.

- **Task 1:** Git branching strategy and repository rules / pull-request evidence.
- **Task 2:** CI workflow and successful test, lint, and build checks.
- **Task 3:** ECR/EKS deployment and application health verification.
- **Task 4:** Dev/Test/Prod workflow and production approval/deployment.
- **Task 5:** Terraform plan/apply, CloudWatch log group, and EKS control-plane logging.
- **Task 6:** CI validation and the `/secret-status` response (without exposing secret contents).
- **Task 7:** T7-1 to T7-5 — Docker build, image push, ECR listing, and digest verification. T7-6 — CI checks/PR evidence; confirm that this screenshot has been saved.
- **Task 8:** T8-1 — pod/Deployment status; T8-2 — Service and probes; T8-3 — `/health` response; T8-4 — `/secret-status` response.

Keep screenshots free of credentials, access keys, tokens, and secret values.

## Dependencies and Tools

- Git and GitHub
- Node.js 22 and npm
- Docker
- AWS CLI and AWS permissions for the required resources
- Amazon ECR and Amazon EKS
- `kubectl`
- Terraform
- GitHub Actions with OIDC-based AWS authentication

## Basic Application Validation

Run these commands from the repository root:

```bash
npm ci
npm test
npm run lint
npm run build
docker build -t devops-ai-masters-capstone:latest .
```

For AWS and Kubernetes operations, ensure the appropriate AWS identity and EKS context are selected before running commands. Do not run deployment or infrastructure changes against an unintended environment.

## Author

**Name:** Kaushik Shettigar

**Program:** DevOps with AI Masters Program

**Project Type:** Individual Capstone Project

## Development Environment

- **Cloud Platform:** Amazon Web Services (AWS)
- **AWS Region:** Asia Pacific (Mumbai) — `ap-south-1`
- **Operating System:** Ubuntu 26.04 LTS on the EC2 controller
- **EC2 Instance:** `t3.small`
- **Access:** PuTTY over SSH
- **Source Control:** Git and GitHub
- **Infrastructure as Code:** Terraform
- **Containerization:** Docker
- **Container Orchestration:** Amazon EKS and `kubectl`
- **AWS Authentication:** IAM role attached to EC2; GitHub Actions uses OIDC for AWS access

---

This README will be updated as the project progresses.