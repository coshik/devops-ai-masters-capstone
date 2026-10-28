# Infrastructure as Code with Terraform (Task 5)

**Author:** Kaushik Shettigar
**Configuration:** [`terraform/`](../terraform/)
**Region:** `ap-south-1`

## 1. What the assignment asks

The brief asks for AWS infrastructure to be provisioned with Terraform: a VPC with public and private subnets, an EKS cluster, node groups, IAM roles and CloudWatch monitoring, with the Terraform code and the `plan` and `apply` outputs as deliverables.

## 2. What was implemented

The VPC, the EKS cluster `devops-ai-capstone`, the managed node group `capstone-ng` and their IAM roles were created with **eksctl** for the deployment tasks (Tasks 3 and 4), before this task. The Terraform configuration was added around that existing infrastructure instead of replacing it.

| Terraform manages | Terraform only references (data sources) |
|---|---|
| CloudWatch log group `/aws/eks/devops-ai-capstone/cluster` with 7-day retention | The EKS cluster `devops-ai-capstone` |
| | The managed node group `capstone-ng` |
| | The VPC and subnets |
| | The relevant IAM roles |

EKS control-plane logging for the API server, audit, authenticator, controller manager and scheduler was enabled on the cluster during implementation, and those logs are delivered to the log group above.

## 3. Deviation from the brief

This does **not** meet the full scope of the assignment. Terraform here does not create the VPC, subnets, cluster, node group or IAM roles, so those resources are not reproducible from this repository. The reason is the order of work: the cluster already existed and was running the application when the Terraform task was done. Rebuilding it with Terraform would have meant replacing a working deployment.

## 4. Files

| File | Purpose |
|---|---|
| `versions.tf` | Terraform and provider version constraints |
| `variables.tf` | Input variables |
| `main.tf` | Data sources and the CloudWatch log group |
| `outputs.tf` | Output values |
| `terraform.tfvars.example` | Example variable values (copy to `terraform.tfvars`) |
| `README.md` | Usage notes |

## 5. How it was verified

- `terraform fmt` and `terraform validate` were run on the configuration.
- The plan was reviewed before applying, and the intended change (creating the log group) was applied.
- The log group and control-plane logging were checked in the CloudWatch console.

## 6. Usage

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit values
terraform init
terraform plan
terraform apply
```

Review the plan carefully before applying, since the configuration points at real, existing infrastructure.

**Note.** The data sources need the cluster to exist. The AWS infrastructure was torn down after the capstone was submitted, so the configuration will not plan until a cluster named `devops-ai-capstone` is recreated.

## 7. Possible improvement

To fully meet the assignment, the configuration would be extended with `modules/vpc` and `modules/eks` that create the VPC (public and private subnets), the EKS cluster, the node group and the IAM roles. The cluster would then be rebuilt from that code instead of eksctl.

## 8. Evidence

- `docs/evidence/task05-0-terraform-validate-and-plan.png` — validation and plan
- `docs/evidence/task05-1-terraform-plan.png` — plan output
- `docs/evidence/task05-2-cloudwatch-log-group.png` — the log group in CloudWatch
- `docs/evidence/task05-3-eks-control-plane-logging.png` — control-plane logging enabled
- `docs/evidence/task05-4-terraform-commit.png` — the Terraform commit
