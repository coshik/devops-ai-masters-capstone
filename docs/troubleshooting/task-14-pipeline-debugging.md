# Task 14 — Pipeline Debugging

## 1. Objective

Demonstrate a controlled GitHub Actions pipeline failure, identify its root cause, and validate the correction.

## 2. Failure Details

- **Workflow:** CI
- **Job:** Test, Lint and Build
- **Failed step:** Verify build artifact
- **GitHub Actions run:** https://github.com/coshik/devops-ai-masters-capstone/actions/runs/39109419311
- **Failing command:** `ls -la dist-debug/`
- **Observed error:** `ls: cannot access 'dist-debug/': No such file or directory`
- **Exit code:** 2

## 3. Root Cause Analysis

The failure was intentionally introduced by changing the artifact verification command to inspect `dist-debug/` instead of `dist/`.

The expected build artifact directory was not found at the configured path. The shell command returned exit code 2, and GitHub Actions marked the verification step and CI job as failed.

## 4. Resolution

Restore the verification command to `ls -la dist/`, commit the correction on the `feature/pipeline-debugging` branch, and verify that the GitHub Actions workflow passes.

## 5. Validation

- **Before correction:** Pipeline failed at Verify build artifact.
- **After correction:** Record the actual GitHub Actions result and run URL here.

## 6. Evidence

Attach or reference the failure log and screenshot from the failed GitHub Actions run.
