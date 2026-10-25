# AWS Enterprise DevOps Capstone Project

**Name:** Kaushik Shettigar
**Program:** DevOps with AI Masters Program
**Assignment:** AWS Enterprise DevOps Capstone Project (individual)
**Repository:** https://github.com/coshik/devops-ai-masters-capstone

## 1. Problem statement

Build an end-to-end, enterprise-style DevOps platform on AWS that demonstrates the day-to-day responsibilities of a DevOps engineer: source control and collaboration, CI/CD, infrastructure as code, containerization and Kubernetes operations, observability, DevSecOps, troubleshooting and cost optimization. The assignment has 16 tasks across 8 phases, and each task requires verifiable evidence (files, logs, screenshots, reports).

## 2. Solution approach

A Node.js (Express) application is built, tested and scanned by GitHub Actions, packaged as a Docker image in Amazon ECR, and deployed to Amazon EKS through a multi-stage pipeline with a manual approval gate before production.

```
Developer ─▶ feature/* ─PR─▶ develop ─PR─▶ main
                               │              │
                          CI: install, test, lint, build,
                          dependency audit (fails on critical)
                                              │
                      CD (push to main): Dev ─▶ Test ─▶ Prod (manual approval)
                                              │
                      OIDC role ─▶ build image ─▶ Amazon ECR ─▶ Amazon EKS
                                              │
        Secrets Manager (via IRSA) · CloudWatch metrics, alarms, logs · Helm chart
```

Key design choices:

- **No long-lived AWS keys.** GitHub Actions authenticates to AWS with OpenID Connect and an IAM role.
- **Least-privilege secrets.** The pods read one Secrets Manager secret through IAM Roles for Service Accounts (IRSA). The `/secret-status` endpoint reports whether the secret is available and never returns its value.
- **Security gates.** `npm audit` fails the pipeline on critical vulnerabilities, and the container image is scanned in ECR.
- **Honest evidence.** Failures in Tasks 14 and 15 were introduced deliberately and are documented as such.

**Scope note.** The VPC, EKS cluster (`devops-ai-capstone`), node group and IAM roles were created with eksctl. The Terraform configuration references them with data sources and manages the CloudWatch logging configuration. It does not manage the whole cluster.

## 3. Tasks and documentation

| Phase | Task | Summary | Documentation |
|---|---|---|---|
| 1 Source control | 1 | Branching (`main`, `develop`, `feature/*`), rulesets, pull requests | [branching-strategy.md](branching-strategy.md) |
| 2 CI/CD | 2 | CI on pushes and PRs: install, test, lint, build | [docs/cicd-pipeline.md](docs/cicd-pipeline.md), `.github/workflows/ci.yml` |
| | 3 | Continuous delivery to EKS with production approval | [docs/cicd-pipeline.md](docs/cicd-pipeline.md), `.github/workflows/cd.yml` |
| | 4 | Multi-stage Dev / Test / Prod pipeline with environment variables | [docs/cicd-pipeline.md](docs/cicd-pipeline.md), `.github/workflows/cd.yml` |
| 3 IaC | 5 | Terraform for CloudWatch logging, referencing the existing cluster | [docs/task5-terraform-infrastructure.md](docs/task5-terraform-infrastructure.md), [terraform/](terraform/) |
| | 6 | Secrets Manager with IRSA (pods) and an OIDC role (pipeline) | [docs/secrets-management.md](docs/secrets-management.md) |
| 4 Containers | 7 | Hardened Dockerfile and ECR push | `Dockerfile`, `.dockerignore` |
| | 8 | Kubernetes Deployment, Service and probes | [k8s/](k8s/) |
| | 9 | Helm chart with parameterized values | [docs/helm.md](docs/helm.md), [helm/](helm/devops-ai-capstone/) |
| 5 Observability | 10 | Container Insights metrics and CloudWatch alarms with email alerts | [docs/monitoring.md](docs/monitoring.md) |
| | 11 | Centralized logging and Logs Insights queries | [docs/logging.md](docs/logging.md) |
| 6 DevSecOps | 12 | Dependency scanning with a critical-vulnerability gate | [docs/security/dependency-scanning.md](docs/security/dependency-scanning.md) |
| | 13 | ECR image scanning and remediation | [docs/security/container-image-scan.md](docs/security/container-image-scan.md) |
| 7 Troubleshooting | 14 | Pipeline failure, root cause analysis and fix | [docs/troubleshooting/task-14-pipeline-debugging.md](docs/troubleshooting/task-14-pipeline-debugging.md) |
| | 15 | Pod networking failure (DNS), diagnosis and fix | [docs/troubleshooting/task-15-kubernetes-networking.md](docs/troubleshooting/task-15-kubernetes-networking.md) |
| 8 Cost | 16 | Cost review, idle NAT gateway removed, ECR lifecycle policy | [docs/cost-optimization.md](docs/cost-optimization.md), [ecr/](ecr/lifecycle-policy.json) |

Troubleshooting index: [docs/troubleshooting.md](docs/troubleshooting.md).

Architecture: [docs/architecture.md](docs/architecture.md). Security overview: [docs/security.md](docs/security.md).

**Evidence.** Screenshots are in [docs/evidence/](docs/evidence/), named `taskNN-X-description.png`. Each document lists its own evidence files.

## 4. Repository structure

```
.github/workflows/   ci.yml, cd.yml, oidc-diagnostic.yml
app/                 Node.js application (server.js)
tests/               Jest tests
k8s/                 Deployment and Service manifests
helm/                Helm chart (devops-ai-capstone)
terraform/           Terraform configuration
ecr/                 ECR lifecycle policy
docs/                Documentation and evidence
Dockerfile           Production image
```

## 5. Prerequisites and setup

| Tool | Purpose |
|---|---|
| Git, GitHub account | Source control and Actions |
| Node.js 22 and npm | Run and test the app |
| Docker | Build the image |
| AWS CLI with permissions for ECR, EKS, IAM, CloudWatch, Secrets Manager | AWS operations |
| `kubectl` | Kubernetes access to the cluster |
| Helm 3 or later | Helm chart (tested with v4.3.0) |
| Terraform | Infrastructure configuration |

AWS resources the pipeline expects (region `ap-south-1`):

- An EKS cluster named `devops-ai-capstone` with a managed node group
- An ECR repository named `devops-ai-masters-capstone`
- A Secrets Manager secret for the app configuration and an IRSA-backed service account named `devops-ai-capstone`
- An IAM role trusted by GitHub OIDC for the workflows, and a GitHub `production` environment with required reviewers

No credentials are stored in this repository. Replace `<account-id>` below with your AWS account ID.

## 6. Execution steps

**1. Run and test the application locally**

```bash
npm ci
npm test
npm run lint
npm run build
node app/server.js          # serves on port 3000
curl http://localhost:3000/health
```

**2. Build the image**

```bash
docker build -t devops-ai-masters-capstone:latest .
```

**3. Push to ECR**

```bash
ECR=<account-id>.dkr.ecr.ap-south-1.amazonaws.com/devops-ai-masters-capstone
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com
docker tag devops-ai-masters-capstone:latest "$ECR:latest"
docker push "$ECR:latest"
```

**4. Deploy through the pipeline (normal path)**

1. Create a `feature/*` branch and open a PR into `develop`. CI runs tests, lint, build and the dependency audit.
2. Promote with a PR from `develop` into `main`.
3. The push to `main` starts the CD workflow: Dev, Test, then Prod, which waits for manual approval.

**5. Deploy manually with kubectl**

```bash
aws eks update-kubeconfig --name devops-ai-capstone --region ap-south-1
kubectl apply -f k8s/
kubectl rollout status deployment/devops-ai-capstone
kubectl get pods,svc
```

**6. Deploy with Helm**

```bash
helm lint helm/devops-ai-capstone
helm install capstone-helm helm/devops-ai-capstone
helm upgrade capstone-helm helm/devops-ai-capstone \
  --set replicaCount=3 --set image.tag=<tag> --set resources.limits.memory=512Mi
helm history capstone-helm
```

**7. Terraform**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # then edit values
terraform init
terraform plan
terraform apply
```

Review the plan before applying. Details are in [terraform/README.md](terraform/README.md).

**8. Verify**

```bash
curl http://<load-balancer-dns>/health          # {"status":"healthy"}
curl http://<load-balancer-dns>/secret-status   # {"configured":true}
```

Monitoring, logging and troubleshooting commands are in the documents linked in section 3.

## 7. Notes and limitations

- To limit cost, worker nodes are scaled to zero and the controller instance is stopped when idle. Scale the node group back up before running any `kubectl` or Helm commands.
- The Helm release `capstone-helm` was a separate demonstration release and was uninstalled after the evidence was captured. The CD pipeline deploys with `kubectl apply`.
- The idle NAT gateway was removed (Task 16). Private nodes added later would need a NAT gateway or VPC endpoints.
- Do not commit secrets, credentials or tokens, and keep them out of screenshots.
