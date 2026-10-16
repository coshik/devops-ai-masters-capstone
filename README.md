# DevOps with AI Masters Program - Capstone Project

## Project Status

🚧 Project in progress

Tasks 1–8 have been implemented to the extent documented below. Remaining phases include DevSecOps, Observability, Troubleshooting, and Cost Optimization work; the capstone is not yet complete.

## About

This repository contains my individual capstone project for the DevOps with AI Masters Program.

The project covers:

- Source Control & Collaboration
- CI/CD Pipelines
- Infrastructure as Code using Terraform
- Containerization & Kubernetes
- DevSecOps
- Observability
- Troubleshooting
- Cost Optimization

## Project Approach

The project is implemented individually using AWS cloud infrastructure and DevOps tools. Changes are developed on feature branches, validated with GitHub Actions, and merged through pull requests.

## Implemented Work

### Source Control & Collaboration

- Used a branching strategy with `main` for production, `develop` for integration, and `feature/*` branches for changes.
- Configured GitHub rulesets for `main` and `develop` and used pull requests to merge changes.

### CI/CD Pipelines

- Added GitHub Actions CI validation for dependency installation, tests, lint checks, and build verification.
- Implemented a multi-stage deployment workflow with development and testing validation followed by a production deployment to Amazon EKS.
- Configured AWS authentication for GitHub Actions using OpenID Connect (OIDC) and a production approval gate.

### Infrastructure as Code

- Added Terraform configuration under `terraform/` to look up existing AWS infrastructure and manage the EKS control-plane CloudWatch log group with seven-day retention.
- Terraform validation and plan/apply were verified.
- **Scope note:** the existing VPC, EKS cluster, node group, and IAM roles are referenced by Terraform data sources; this configuration does not create or fully manage those existing resources.

### Task 7 — Dockerization

- Added a production-oriented `Dockerfile` using Node.js 22 Alpine, production-only dependency installation, `NODE_ENV=production`, and a non-root `node` user.
- Added `.dockerignore` to keep Git metadata, local dependencies, test output, infrastructure files, and other non-image files out of the Docker build context.
- Built the application image and pushed it to Amazon Elastic Container Registry (ECR).

**ECR repository:** `288761772142.dkr.ecr.ap-south-1.amazonaws.com/devops-ai-masters-capstone`

**Region:** `ap-south-1`

The manually verified `latest` image push on 2026-10-15 returned digest:

`sha256:aa161a0d7939046663ed8ac3e19cab9c779b86b5aaae85195267d0d05d658696`

The running EKS Deployment was observed using a commit-specific image tag, so pushing `latest` does not by itself imply that the cluster is running that latest image.

Build and push commands:

```bash
docker build -t devops-ai-masters-capstone:latest .
ECR=288761772142.dkr.ecr.ap-south-1.amazonaws.com/devops-ai-masters-capstone
docker tag devops-ai-masters-capstone:latest "$ECR:latest"
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  288761772142.dkr.ecr.ap-south-1.amazonaws.com
docker push "$ECR:latest"
```

Verify the published tag and digest:

```bash
aws ecr describe-images \
  --repository-name devops-ai-masters-capstone \
  --region ap-south-1 \
  --image-ids imageTag=latest \
  --query 'imageDetails[0].[imageTags,imageDigest,imagePushedAt]' \
  --output json
```

### Task 8 — Kubernetes Deployment & Service

Kubernetes manifests are maintained in `k8s/`:

- `k8s/deployment.yaml`: Deployment with two replicas and HTTP readiness and liveness probes against `/health` on port `3000`.
- `k8s/service.yaml`: LoadBalancer Service exposing port `80` and forwarding to container port `3000`.
- The Deployment configures the AWS region and the Secrets Manager secret ARN as environment variables; the application exposes `/secret-status` without returning the secret value.

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

**Observed verification:** rollout succeeded; both pods were `1/1 Running` with zero restarts; Deployment reported `2/2` available; Service had an external LoadBalancer DNS name; readiness and liveness probes were visible in the Deployment description. The health and secret-status endpoints were checked successfully during the session.

## Evidence & Screenshots

Screenshots are maintained locally in a phase-based folder structure and are not assumed to be present in this repository.

- **Task 7:** T7-1 to T7-5 — Docker build, image push, ECR image listing and digest verification. T7-6 — CI checks/PR evidence; confirm this screenshot has been saved.
- **Task 8:** T8-1 — pod and Deployment status; T8-2 — Service and probe configuration; T8-3 — `/health` response; T8-4 — `/secret-status` response.

Keep screenshots free of credentials, access keys, tokens, and sensitive secret values.

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
- **AWS Authentication:** IAM roles; GitHub Actions uses OIDC for AWS access

---

This README is updated as implementation and verification progress.