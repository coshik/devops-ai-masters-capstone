# Monitoring and Alerts (Task 10)

**Author:** Kaushik Shettigar
**Cluster:** `devops-ai-capstone` (Amazon EKS, `ap-south-1`)
**Date:** 2026-10-24

## 1. Objective

Collect CPU and memory metrics from the EKS cluster in CloudWatch and alert when thresholds are breached.

## 2. Metrics collection

Metrics are collected with the **Amazon CloudWatch Observability** EKS add-on (version `v6.7.0-eksbuild.1`), which enables CloudWatch Container Insights.

**Permissions.** The AWS-managed policy `CloudWatchAgentServerPolicy` was attached to the managed node group's IAM role so the agent can write metrics and logs.

**Installation:**

```bash
aws eks create-addon --cluster-name devops-ai-capstone --region ap-south-1 \
  --addon-name amazon-cloudwatch-observability
```

**Result.** The add-on status became `ACTIVE`, and the `amazon-cloudwatch` namespace runs a controller manager, one CloudWatch agent per node and one Fluent Bit pod per node (all `Running`). Metrics appear in the `ContainerInsights` namespace, including `node_cpu_utilization` and `node_memory_utilization`, dimensioned by `ClusterName=devops-ai-capstone`.

Observed baseline: node CPU under about 3% and node memory around 40%.

## 3. Alerting

A notification channel and two alarms were created.

**SNS topic:** `devops-capstone-alerts`, with an email subscription (confirmed through the AWS confirmation email).

| Alarm | Metric | Condition | Evaluation |
|---|---|---|---|
| `capstone-node-cpu-high` | `node_cpu_utilization` | Average > 70% | 5-minute periods, 2 consecutive |
| `capstone-node-memory-high` | `node_memory_utilization` | Average > 75% | 5-minute periods, 2 consecutive |

Both alarms send to the SNS topic on `ALARM`. Missing data is treated as not breaching, so a gap in metrics does not raise a false alert.

**Threshold rationale.** The baseline is far below both limits, leaving headroom for normal spikes. 70% CPU and 75% memory warn early enough to act before the nodes saturate. Two evaluation periods filter out brief spikes.

## 4. Alert test

To prove alerts are delivered, the CPU alarm was temporarily changed to a threshold of **1%** with a 60-second period and a single evaluation period. Normal CPU (about 2%) exceeded it.

Result:

- The alarm changed from `OK` to `ALARM` at 13:47:34 UTC on 2026-10-24.
- The notification email arrived through SNS, showing the reason for the state change, the metric and the topic.

The alarm was then **restored to the real 70% threshold**. Both alarms returned to `OK`.

## 5. Limitations and hardening

- `CloudWatchAgentServerPolicy` is attached to the shared node role, so every pod on the nodes inherits it. A tighter setup uses a dedicated IAM role for service accounts (IRSA) for the CloudWatch agent only.
- The alarms watch node-level metrics. Pod-level alarms (for example, restarts or pod CPU against limits) could be added per workload.
- Container Insights bills for ingested metrics and logs. It is included in the cost review (Task 16).

## 6. Evidence

- `docs/evidence/task10-1-cloudwatch-addon.png` — add-on pods and `ACTIVE` status
- `docs/evidence/task10-2-container-insights-metrics.png` — CPU and memory metrics
- `docs/evidence/task10-3-alarm-configuration.png` — alarm names and thresholds (70 and 75)
- `docs/evidence/task10-4-alarm-triggered.png` — alarm in `ALARM` state during the test
- `docs/evidence/task10-5-alert-email.png` — SNS notification email
