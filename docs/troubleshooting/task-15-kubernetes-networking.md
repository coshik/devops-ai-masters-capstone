# Task 15 — Kubernetes Networking Issue: Pod Cannot Reach an External Service

**Date:** 2026-10-22
**Cluster:** `devops-ai-capstone` (Amazon EKS, `ap-south-1`, 2 worker nodes)
**Author:** Kaushik Shettigar

## 1. Objective

Demonstrate a pod that cannot access an external service, diagnose the cause across networking, security groups and routing, then fix and validate it.

## 2. Approach

The cluster's networking was healthy, so the failure was **introduced deliberately** in an isolated test pod. I did not modify the shared node security group, route tables or NACLs, because doing so could cut the worker nodes off from ECR and the EKS control plane.

The failure chosen was a misconfigured DNS resolver on a single pod, which is a common real-world cause of "pod cannot reach external service" tickets.

## 3. Baseline (working state)

A pod using the cluster's default DNS reached the external site:

```bash
kubectl run dns-baseline --image=curlimages/curl:latest --restart=Never --rm -it \
  --command -- sh -c 'cat /etc/resolv.conf; curl -sI --connect-timeout 5 https://example.com | head -1'
```

Result: `nameserver 10.100.0.10` (cluster DNS service) and `HTTP/2 200`.

## 4. Failure injected

A test pod was created with its DNS policy overridden to point at a non-existent nameserver:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dns-broken
spec:
  restartPolicy: Never
  dnsPolicy: "None"
  dnsConfig:
    nameservers: ["10.255.255.1"]
  containers:
  - name: curl
    image: curlimages/curl:latest
    command: ["sleep", "3600"]
```

## 5. Symptom

```bash
kubectl exec dns-broken -- curl -sS -I --connect-timeout 5 https://example.com
```

Result: `curl: (28) Resolving timed out after 5001 milliseconds` (exit code 28).

The pod could not reach the external service.

## 6. Diagnosis (layer by layer)

| Layer | Check | Finding |
|---|---|---|
| Security group (`sg-09d0f901f54edc96a`) | `aws ec2 describe-security-groups` | Egress allows all traffic to `0.0.0.0/0` — not the cause |
| Network ACL (`acl-0f8520c3158b97595`) | `aws ec2 describe-network-acls` | Rule 100 allows all inbound and outbound IPv4 traffic — not the cause |
| Routing | `aws ec2 describe-route-tables` | Worker subnets have a `0.0.0.0/0` route to an Internet Gateway — not the cause |
| Connectivity by IP | `kubectl exec dns-broken -- curl -sS -I --connect-timeout 5 https://1.1.1.1` | `HTTP/2 301` — outbound traffic works |
| DNS configuration | `kubectl exec dns-broken -- cat /etc/resolv.conf` | `nameserver 10.255.255.1` — not the cluster DNS (`10.100.0.10`) |

**Reasoning:** reaching `1.1.1.1` by IP succeeded, which proves the security group, NACL, route table, Internet Gateway and node egress all work. Only name resolution failed, so the fault is the pod's DNS configuration.

## 7. Root cause

The pod's `dnsPolicy: None` with `dnsConfig.nameservers: ["10.255.255.1"]` replaced the cluster DNS service with an unreachable resolver, so no hostname could be resolved.

## 8. Fix

A pod's `dnsPolicy` cannot be edited in place, so the broken pod was deleted and a replacement was created using the default DNS policy (`ClusterFirst`):

```bash
kubectl delete pod dns-broken
kubectl run dns-fixed --image=curlimages/curl:latest --restart=Never --rm -it \
  --command -- sh -c 'cat /etc/resolv.conf; curl -sI --connect-timeout 5 https://example.com | head -1'
```

## 9. Validation

Result: `nameserver 10.100.0.10` restored and `HTTP/2 200` from `https://example.com`.

Cleanup confirmed with `kubectl get pods`: only the two application pods (`devops-ai-capstone-*`) remained, with no test pods left behind.

## 10. Additional findings (discovered, not introduced)

These were observed during investigation and are separate from the deliberate failure above:

- **IPv6 egress fails while IPv4 works.** `curl -6` to `example.com` failed immediately. The AWS VPC CNI has IPv6 disabled (`ENABLE_IPV6=false`), and the security group, NACL and routes carry IPv4 rules only. IPv4 is the supported path for this cluster, so no change was made.
- **VPC CNI IP-allocation messages at node startup.** Earlier `aws-node` logs showed pod IP-allocation constraints while nodes were starting. These were not shown to block internet access and were not investigated as the cause of the demo failure.

## 11. Lessons learned and prevention

- Test by IP first, then by hostname, to separate routing/firewall problems from DNS problems quickly.
- Check from the outside in: security group, NACL, route table, then DNS inside the pod.
- Avoid custom `dnsPolicy` settings unless required, and review them in code review.
- Use test pods in isolation instead of changing shared network resources.
- Considered but not used: Kubernetes NetworkPolicy. The VPC CNI add-on has no custom configuration (`enableNetworkPolicy` not set), so policies would not be enforced on this cluster.

## 12. Evidence

Screenshots are stored under `docs/evidence/`:

- `task15-1-baseline.png` — working pod, `HTTP/2 200`
- `task15-2-failure.png` — DNS resolve timeout
- `task15-3-diagnosis.png` — `resolv.conf` and the by-IP test
- `task15-4-fixed.png` — restored DNS and `HTTP/2 200`
