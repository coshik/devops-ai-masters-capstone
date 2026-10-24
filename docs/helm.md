# Helm Chart (Task 9)

**Author:** Kaushik Shettigar
**Chart:** `helm/devops-ai-capstone`
**Release:** `capstone-helm` (namespace `default`)

## 1. Objective

Package the application as a Helm chart with parameterized values for the image tag, replica count and resource limits, then show a successful install and upgrade.

## 2. Chart layout

```
helm/devops-ai-capstone/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml
    └── service.yaml
```

## 3. Parameterized values

| Value | Default | Purpose |
|---|---|---|
| `image.tag` | `latest` | Image tag to deploy (override with a commit tag for reproducible releases) |
| `replicaCount` | `2` | Number of pod replicas |
| `resources.requests` / `resources.limits` | 100m CPU, 128Mi / 250m CPU, 256Mi | CPU and memory requests and limits |
| `service.type` | `ClusterIP` | Service type (`LoadBalancer` for external access) |
| `aws.region`, `aws.secretArn` | `ap-south-1`, the app secret ARN | Environment for Secrets Manager access |
| `serviceAccount.name` | `devops-ai-capstone` | Existing IRSA-backed service account |

Readiness and liveness probes (`/health`) are also configurable under `probes`.

## 4. Design decisions

- **Separate release.** The chart installs as `capstone-helm` next to the original `kubectl`-managed Deployment, so the live deployment and the CD pipeline are unaffected.
- **Different labels.** Chart pods use `app.kubernetes.io/*` labels instead of `app: devops-ai-capstone`, so the existing LoadBalancer Service does not send traffic to them.
- **Existing service account.** The chart reuses the IRSA service account instead of creating a new one, so the pods keep their restricted Secrets Manager permissions.
- **ClusterIP by default.** This avoids creating a second load balancer (and its cost).

## 5. Validation

```bash
helm lint helm/devops-ai-capstone
helm template capstone-helm helm/devops-ai-capstone
```

Lint passed (`1 chart(s) linted, 0 chart(s) failed`) and the rendered manifests showed the expected labels, probes, resources and image.

## 6. Install

```bash
helm install capstone-helm helm/devops-ai-capstone
```

Result: release `capstone-helm` `deployed` at revision 1. Both pods reached `1/1 Running` with zero restarts, and the Service was created as `ClusterIP`.

Health check through a port-forward:

```bash
kubectl port-forward svc/capstone-helm-devops-ai-capstone 8080:80 &
curl -i http://localhost:8080/health
```

Result: `HTTP/1.1 200 OK` with `{"status":"healthy"}`.

## 7. Upgrade

The image tag, replica count and a resource limit were changed in a single upgrade:

```bash
helm upgrade capstone-helm helm/devops-ai-capstone \
  --set replicaCount=3 \
  --set image.tag=c5b86bc7b3dd1b3ff694ff9154533820ca906758 \
  --set resources.limits.memory=512Mi
```

The image tag is the commit tag the original Deployment was running at the time. Result:

- Rollout completed successfully, with 3 pods `1/1 Running`.
- `helm history capstone-helm` shows revision 1 `superseded` (install) and revision 2 `deployed` (upgrade).
- `helm get values capstone-helm` shows the three overridden values.

## 8. Rollback

An earlier revision can be restored with `helm rollback capstone-helm 1`. This was not needed here.

## 9. Evidence

- `docs/evidence/task09-1-helm-lint-template.png` — lint and rendered manifests
- `docs/evidence/task09-2-helm-install.png` — install, pods and Service
- `docs/evidence/task09-3-helm-health.png` — `/health` response through the Helm release
- `docs/evidence/task09-4-helm-upgrade-history.png` — upgrade, history and values
