# Centralized Logging and Queries (Task 11)

**Author:** Kaushik Shettigar
**Cluster:** `devops-ai-capstone` (Amazon EKS, `ap-south-1`)
**Date:** 2026-10-24

## 1. Objective

Ship Kubernetes logs to CloudWatch Logs and query the last 24 hours of errors.

## 2. Centralized logging

The CloudWatch Observability add-on (see [monitoring.md](monitoring.md)) runs Fluent Bit on every node and ships logs to four log groups:

| Log group | Content |
|---|---|
| `/aws/containerinsights/devops-ai-capstone/application` | Container logs from pods |
| `/aws/containerinsights/devops-ai-capstone/dataplane` | Node components such as kubelet and kube-proxy |
| `/aws/containerinsights/devops-ai-capstone/host` | Host-level system logs |
| `/aws/containerinsights/devops-ai-capstone/performance` | Container Insights performance events |

The EKS control-plane logs go to `/aws/eks/devops-ai-capstone/cluster` (configured in Task 5).

**Retention.** The new groups were created with no expiry, so a **7-day retention** was set on all four to limit storage cost, matching the control-plane log group:

```bash
for g in application dataplane host performance; do
  aws logs put-retention-policy --region ap-south-1 \
    --log-group-name /aws/containerinsights/devops-ai-capstone/$g --retention-in-days 7
done
```

## 3. Queries (CloudWatch Logs Insights, last 24 hours)

All queries run against the `application` log group with the time range set to the last 24 hours. Each excludes the `amazon-cloudwatch` namespace.

**Why the exclusion.** The first, unfiltered query matched 62 records, but all came from the `cloudwatch-agent` and `fluent-bit` pods. They were configuration lines containing the words `error` or `failed` (for example `error_mode: ignore`) and harmless startup warnings that Docker and CRI-O sockets were not found (the nodes use containerd). None was an application error, so the monitoring agents' own namespace is excluded to keep the results meaningful.

**1. Error events:**

```
fields @timestamp, kubernetes.namespace_name, kubernetes.pod_name, log
| filter kubernetes.namespace_name != "amazon-cloudwatch"
| filter log like /(?i)(error|exception|fail)/
| sort @timestamp desc
| limit 50
```

**2. Error count per pod:**

```
filter kubernetes.namespace_name != "amazon-cloudwatch"
| filter log like /(?i)(error|exception|fail)/
| stats count(*) as errors by kubernetes.pod_name
| sort errors desc
```

**3. Hourly error trend:**

```
filter kubernetes.namespace_name != "amazon-cloudwatch"
| filter log like /(?i)(error|exception|fail)/
| stats count(*) as errors by bin(1h)
```

**4. Node-level errors (`dataplane` log group, last 24 hours):**

```
fields @timestamp, @message
| filter @message like /(?i)(error|fail)/
| sort @timestamp desc
| limit 20
```

This group holds kubelet and containerd logs as JSON, so the query reads `@message` instead of the Kubernetes fields.

## 4. Test event and results

The application was healthy and produced no errors, so a labeled test event was generated deliberately:

```bash
kubectl run log-test --image=busybox --restart=Never -- sh -c 'echo "ERROR: simulated failure for log query test"; sleep 120'
sleep 90
kubectl delete pod log-test
```

Results:

- **Query 1:** 1 matching record from pod `log-test` in the `default` namespace, with the message `ERROR: simulated failure for log query test`. The expanded record shows the full path: stream `stdout`, pod name, namespace and the node it ran on.
- **Query 2:** `log-test` with 1 error.
- **Query 3:** a single data point of 1 error in the hour of the test.

- **Query 4 (`dataplane`):** 3 matching records from `kubelet` and `containerd`, all at about 15:15 UTC, shortly after the test pod was deleted. They are "container not found" messages (for example, `ContainerStatus ... failed` and `DeleteContainer returned error`), consistent with the runtime cleaning up the removed `log-test` container. They are harmless and show that node-level errors can be queried from the same place.

The test pod was deleted afterwards, and only the application pods remain.

**Note.** Container logs are only available from when the add-on was installed on 2026-10-24, so "last 24 hours" covers a shorter window here. Normal operation produced no application errors.

## 5. Possible improvements

- Add a CloudWatch metric filter on `ERROR` log lines and alarm on it, so errors raise alerts like the CPU and memory alarms.
- Have the application log structured JSON with a `level` field for more precise filtering.
- Keep the 7-day retention for this project, and raise it for production.

## 6. Evidence

- `docs/evidence/task11-1-log-groups-retention.png` — log groups with 1-week retention
- `docs/evidence/task11-2-errors-last-24h.png` — query 1 with the expanded test record
- `docs/evidence/task11-3-errors-by-pod.png` — query 2
- `docs/evidence/task11-4-error-trend.png` — query 3
- `docs/evidence/task11-5-dataplane-query.png` — query 4 on the `dataplane` log group
