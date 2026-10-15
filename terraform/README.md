# Terraform Infrastructure — Task 5

## Purpose
This configuration uses Terraform data sources to discover and document
the existing AWS capstone infrastructure without recreating it.

## Existing infrastructure inspected
- AWS region: ap-south-1
- EKS cluster: devops-ai-capstone
- Managed node group: capstone-ng
- VPC and associated subnets
- Controller and node-group IAM roles

## Safety
The current configuration is read-only: it declares data sources and outputs,
not resources to create, update, or destroy. A successful plan should report
no changes to managed resources because no managed resources are declared.

## Validation
Run `terraform init`, `terraform fmt -check`, `terraform validate`,
`terraform plan`, and `terraform output` after applying is NOT required.
Do not run `terraform apply` for this read-only configuration.

## Monitoring follow-up
EKS control-plane logging is currently disabled. Enabling API, audit,
authenticator, controller-manager, and scheduler logs should be reviewed
as a separate, explicit change. CloudWatch log ingestion and storage can
incur charges; configure retention and validate the expected changes first.
