# Container Image Security Scan and Remediation

## 1. Objective

Scan the application's Amazon ECR container images, document reported vulnerabilities, apply a remediation, and verify the result with a fresh image scan.

**AWS Region:** `ap-south-1`  
**ECR Repository:** `devops-ai-masters-capstone`  
**CVE investigated:** `CVE-2026-85091`

## 2. Initial scan results

On 17 October 2026, two ECR images were scanned.

| Image tag | Image digest | Critical | High | Medium | Low | Info |
|---|---|---:|---:|---:|---:|---:|
| `011f86362b3182ee350918e1f2a20cb9622cddc4` (deployed release) | `sha256:d623cb217a45d20bd03b85d50308fda381afb34b0d8da4a28fea2f4ba2eee124` | 0 | 1 | 0 | 0 | 0 |
| `c5b86bc7b3dd1b3ff694ff9154533820ca906758` (`latest`) | `sha256:e9d83188b119ee9a5a125b4dad5d66f0da6d86f8cf8fb7b1eb7bb9a467b4b697` | 0 | 1 | 0 | 0 | 0 |

Both scans reported a high-severity vulnerability, `CVE-2026-85091`, associated with the Alpine package `zlib-1.3.2-r0`.

The reported issue describes a heap buffer overflow in certain non-blocking `gzwrite()` scenarios involving stale external buffer pointers. The scan result identifies a vulnerable package; it does not independently confirm that the application is exploitable.

Reference: https://nvd.nist.gov/vuln/detail/CVE-2026-85091

## 3. Remediation

The Dockerfile was updated to upgrade Alpine packages during image construction:

```dockerfile
FROM node:22-alpine

RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app ./app

USER node

EXPOSE 3000

CMD ["node", "app/server.js"]
```

A new image was built from the `feature/container-image-security` branch. The installed zlib package was verified inside the resulting container:

```bash
docker run --rm --entrypoint sh devops-ai-masters-capstone:security-fix \
  -c "apk info -v | grep '^zlib-'"
```

The verified package version was:

```text
zlib-1.3.2-r1
```

The image was tagged and pushed to ECR using a unique tag to avoid overwriting `latest` or the existing deployed-release tag.

## 4. Post-remediation scan

| Property | Result |
|---|---|
| ECR image tag | `security-fix-cve-2026-85091` |
| Image digest | `sha256:fb9072d98addafad945a3420893b3fb1cd7512c8ea7402dd78c8cc584ccd7caf` |
| Scan completed | 18 October 2026, 11:31:53 IST |
| Scan status | Complete |
| Critical findings | 0 |
| High findings | 0 |
| Medium findings | 0 |
| Low findings | 0 |
| Informational findings | 0 |

**Result:** The newly built image completed its ECR vulnerability scan with zero findings across all reported severity categories. The previously reported high-severity finding was not present in this scan result.

## 5. Verification and deployment status

- The new image was built using the security-remediation branch.
- The installed zlib package was verified as `1.3.2-r1`.
- The new image was pushed to ECR and its scan completed successfully.
- The `latest` and deployed-release image tags were not overwritten as part of this remediation.
- The remediated image has not been deployed to EKS as part of this task.
- EKS node groups remained scaled to zero during this image build and scan workflow.

## 6. Evidence

Attach or reference the following screenshots in the assignment submission:

- `T13-1-ecr-deployed-image-scan.png` — initial deployed-release scan.
- `T13-2-ecr-latest-image-scan.png` — initial `latest` image scan.
- Post-remediation ECR scan for `security-fix-cve-2026-85091` — zero findings across all severity categories.
