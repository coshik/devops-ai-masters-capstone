# Task 5 — Terraform Infrastructure

## Existing infrastructure discovered
- AWS region: ap-south-1
- EKS cluster: devops-ai-capstone
- Kubernetes version: 1.34
- VPC: vpc-0b0d4d9c675bfeabf
- Managed node group: capstone-ng
- Node instance type: t3.small
- Node group scaling range: 0–2 instances
- Existing controller and node-group IAM roles
- Six cluster subnets across three Availability Zones

## Terraform implementation
The `terraform/` directory uses AWS provider data sources to discover
the existing EKS cluster, VPC, subnets, node group, and IAM roles.

Terraform manages the CloudWatch log group:
- Name: /aws/eks/devops-ai-capstone/cluster
- Retention: 7 days

## EKS control-plane logging
EKS control-plane logging was enabled using the AWS CLI for the following
log types: api, audit, authenticator, controllerManager, scheduler.

The logging toggle was changed outside Terraform; it is not currently
managed by a Terraform EKS resource.

## Validation and evidence
- Terraform configuration validation succeeded.
- Terraform plan: 1 resource to add, 0 changes, 0 destructions.
- CloudWatch log group creation succeeded.
- CloudWatch log group retention was verified at 7 days.
- EKS control-plane logging verification screenshot: T5-3.

## Scope limitation
The existing VPC, subnets, EKS cluster, node group, and IAM roles are
referenced using Terraform data sources. They are not provisioned or
managed by this Terraform configuration.
