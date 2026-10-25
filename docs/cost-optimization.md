# Cost Optimization Report (Task 16)

**Author:** Kaushik Shettigar
**Account region:** `ap-south-1` (Mumbai)
**Period reviewed:** 1–24 October 2026 (month to date)

## 1. Objective

Review AWS spend with Cost Explorer and Trusted Advisor, identify cost-saving opportunities, and propose (and where safe, apply) optimizations.

## 2. Cost overview

Month-to-date cost by service (Cost Explorer, grouped by service):

| Service | Cost (USD) | Main driver |
|---|---:|---|
| Amazon EKS | 37.52 | Control plane, billed hourly while the cluster exists |
| EC2 - Other | 25.12 | NAT gateway hours and EBS volumes (see section 3) |
| Elastic Load Balancing | 9.58 | Classic load balancer created by the application's `LoadBalancer` Service |
| EC2 compute | 6.07 | t3.small worker nodes and controller instance |
| Virtual Private Cloud | 5.64 | Public IPv4 addresses and related networking |
| CloudWatch | 2.80 | Logs and metrics, including Container Insights |
| Tax | 15.63 | Not controllable |
| **Total** | **about 102** | About 87 before tax |

Figures are month to date and were queried at different times, so sub-totals may not sum exactly. Worker nodes are scaled to zero and the controller instance is stopped when not in use, which is why EC2 compute is the smallest large item. The EKS control plane cannot be paused.

## 3. Finding 1: idle NAT gateway (applied)

**Evidence.** The `EC2 - Other` line was broken down by usage type:

| Usage type | Cost (USD) |
|---|---:|
| `APS3-NatGateway-Hours` | 21.50 |
| `APS3-EBS:VolumeUsage.gp3` | 4.08 |

The single NAT gateway (`nat-086fa560db24ce58f`) was therefore the largest item in that line. Checks showed it was unused:

- **Nodes do not use it.** The worker nodes run in subnets `subnet-0ea70ca949d537ba2` and `subnet-0769a46ff765ec6ef`, which route `0.0.0.0/0` through the Internet Gateway, and the nodes have public IP addresses.
- **Nothing runs behind it.** The subnet routed through the NAT gateway (`subnet-01b5ed1b12642d676`) contained no network interfaces.
- **No traffic.** The CloudWatch metric `AWS/NATGateway BytesOutToDestination` was **0 bytes on every day from 10 to 24 October**.

**Action.** The NAT gateway was deleted and its Elastic IP (`eipalloc-01408b37a55a7307e`) was released, because an unattached Elastic IP continues to incur charges.

**Verification.** After deletion both worker nodes stayed `Ready` and the application's `/health` endpoint through the load balancer still returned `{"status":"healthy"}`.

**Saving.** The gateway cost about $0.056 per hour, roughly **$40 per month**, for zero traffic.

**Caveat.** The VPC was created by eksctl, so deleting the gateway by hand causes drift from its CloudFormation stack. The private subnets' route table now has a route to a deleted gateway. This is harmless while nothing runs in private subnets, but private nodes added later would have no outbound internet access until a NAT gateway or VPC endpoints are added. A cluster teardown with eksctl is unaffected.

## 4. Finding 2: ECR repository without a lifecycle policy (applied)

Trusted Advisor lists "Amazon ECR Repository Without Lifecycle Policy Configured", and `aws ecr get-lifecycle-policy` confirmed the repository `devops-ai-masters-capstone` had none (`LifecyclePolicyNotFoundException`). The CD pipeline pushes a new image on every deployment, so images would accumulate forever and storage cost would grow.

**Policy applied** (stored in the repository at `ecr/lifecycle-policy.json`):

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Expire untagged images after 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": { "type": "expire" }
    },
    {
      "rulePriority": 2,
      "description": "Keep only the 20 most recent images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 20
      },
      "action": { "type": "expire" }
    }
  ]
}
```

**Preview before applying.** A lifecycle policy preview (which deletes nothing) reported **3 images would expire, all untagged**. No tagged image, including the running deployment tag and `latest`, was affected, so the policy was applied.

**Saving.** Small for this project, but it prevents unbounded growth and removes the stale untagged images.

## 5. Trusted Advisor

Trusted Advisor's cost checks were not available: the console shows a banner that an upgraded AWS Support plan is required for the full set of checks, and the checks listed are greyed out. Cost Explorer and CLI analysis were used instead. The one visible check, the ECR lifecycle policy, matched Finding 2.

## 6. Further recommendations (not applied)

| Recommendation | Reason |
|---|---|
| Delete the EKS cluster and related resources after submission | The control plane is the largest cost and cannot be paused. Remove it with the load balancer, log groups, alarms and SNS topic |
| Remove the CloudWatch Observability add-on when not needed | Container Insights bills for ingested metrics and logs. Log retention is already set to 7 days |
| Use Spot or Graviton (t4g) worker nodes | Lower hourly cost for non-production workloads |
| Share one load balancer through an ingress | Each `LoadBalancer` Service creates its own billed load balancer |
| Avoid public IPv4 addresses where possible | Public IPv4 addresses are billed hourly |
| Create an AWS Budget with an email alert | Early warning before spend grows |

Savings Plans and reserved capacity are not worthwhile for a short-lived project.

## 7. Summary

| Item | Status | Estimated impact |
|---|---|---|
| Idle NAT gateway | Deleted, Elastic IP released | About $40 per month saved |
| ECR lifecycle policy | Applied | Prevents unbounded storage growth |
| Cluster teardown after submission | Recommended | Removes the EKS control plane charge |

## 8. Evidence

- `docs/evidence/task16-1-cost-explorer.png` — cost by service
- `docs/evidence/task16-2-trusted-advisor.png` — Trusted Advisor cost optimization page
- `docs/evidence/task16-3-nat-analysis.png` — node subnets and empty NAT-routed subnet
- `docs/evidence/task16-3b-nat-gateway-before.png` — NAT gateway before deletion
- `docs/evidence/task16-4-nat-traffic-and-cost-breakdown.png` — zero NAT traffic and `NatGateway-Hours` cost
- `docs/evidence/task16-5-nat-removed.png` — deletion, Elastic IP release and application health check
- `docs/evidence/task16-6-ecr-lifecycle-policy.png` — lifecycle preview and applied policy
