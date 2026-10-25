# Secrets Management (Task 6)

**Author:** Kaushik Shettigar
**Secret:** `devops-ai-capstone/app-config` in AWS Secrets Manager (`ap-south-1`)

## 1. Objective

Store the application's configuration secret in AWS Secrets Manager and retrieve it dynamically in both the Kubernetes pods and the CI/CD pipeline, without committing any secret value to the repository.

## 2. Pods: IAM Roles for Service Accounts (IRSA)

- The Node.js application uses the AWS Secrets Manager SDK to read the secret at runtime. The region (`AWS_REGION`) and the secret's ARN (`SECRET_ARN`) are passed as environment variables in the Deployment. The ARN is an identifier, not a secret value.
- The Deployment uses the service account `devops-ai-capstone`, which is mapped to an IAM role through IRSA.
- The role's policy is limited to the **one secret's ARN** instead of granting broad Secrets Manager access.
- The endpoint `/secret-status` reports whether the secret could be read (`{"configured":true}`) and never returns the value.
- Automated tests cover the normal routes and the success and failure paths of `/secret-status`.

**Verification.** `npm test`, `npm run lint` and `npm run build` passed, the CD workflow deployed the change, and the live `/secret-status` endpoint returned `configured: true`.

## 3. Pipeline: OIDC role with a scoped policy

The production job of the CD workflow retrieves the secret dynamically with short-lived credentials:

1. GitHub Actions assumes the IAM role `github-actions-devops-capstone-role` through OpenID Connect, so no AWS keys are stored in GitHub.
2. An inline policy, `read-app-config-secret`, allows `secretsmanager:GetSecretValue` on the single secret ARN and nothing else.
3. The workflow step **Retrieve application secret from Secrets Manager** reads the secret with the AWS CLI, registers it as a masked value (`::add-mask::`) so it cannot appear in logs, and prints only the number of characters retrieved.

```yaml
- name: Retrieve application secret from Secrets Manager
  run: |
    SECRET=$(aws secretsmanager get-secret-value \
      --secret-id devops-ai-capstone/app-config \
      --region "$AWS_REGION" --query SecretString --output text)
    echo "::add-mask::$SECRET"
    echo "Secret retrieved successfully (${#SECRET} characters)"
```

The retrieved value is not written to disk, to the repository or to the logs.

## 4. Security notes

- No secret values, credentials or tokens are committed. Screenshots are checked for them before upload.
- Both paths use temporary credentials (IRSA for pods, OIDC for the pipeline), and each policy names exactly one secret.
- The pipeline step demonstrates dynamic retrieval but does not pass the value on, because the application reads its own secret at runtime.
- Possible improvements: rotate the secret on a schedule, and mount secrets as volumes or use the Secrets Store CSI driver instead of reading them in application code.

## 5. Evidence

- `docs/evidence/task06-1.png` to `task06-4.png` — Secrets Manager configuration and IRSA setup
- `docs/evidence/task06-5-secret-status-response.png` — `/secret-status` response (no secret value)
- `docs/evidence/task06-6-pr11-ci-checks.png` — CI checks for the integration pull request
- `docs/evidence/task06-7-cd-pipeline-success.png` — successful CD run
- `docs/evidence/task06-8-pipeline-secret-retrieval.png` — pipeline step retrieving the secret
