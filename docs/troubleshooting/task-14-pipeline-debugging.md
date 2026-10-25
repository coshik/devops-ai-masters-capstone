# Task 14 — Pipeline Debugging

## 1. Objective

Demonstrate a controlled GitHub Actions pipeline failure, identify its root cause, and validate the correction.

## 2. Failure Details

- **Workflow:** CI
- **Job:** Test, Lint and Build
- **Failed step:** Verify build artifact
- **Failed GitHub Actions run:** https://github.com/coshik/devops-ai-masters-capstone/actions/runs/39109419311
- **Failing command:** `ls -la dist-debug/`
- **Observed error:** `ls: cannot access 'dist-debug/': No such file or directory`
- **Exit code:** 2

## 3. Root Cause Analysis

The failure was intentionally introduced by changing the artifact verification command to inspect `dist-debug/` instead of `dist/`.

The expected build artifact directory was not found at the configured path. The shell command returned exit code 2, and GitHub Actions marked the verification step and CI job as failed.

## 4. Resolution

Restored the verification command to ls -la dist/ on the feature/pipeline-debugging branch, committed the correction, and verified that the GitHub Actions workflow passed.

## 5. Validation

- **Before correction:** Pipeline failed at `Verify build artifact` because `dist-debug/` did not exist.
- **After correction:** Pipeline passed after restoring the command to `ls -la dist/`.
- **Successful GitHub Actions run:** https://github.com/coshik/devops-ai-masters-capstone/actions/runs/39129912018
- **Result:** The pipeline failure was reproduced, diagnosed, corrected, and validated.

## 6. Evidence

- Screenshot of the failed GitHub Actions run.
- Downloaded failure logs showing the missing `dist-debug/` directory and exit code 2.
- Successful GitHub Actions run showing the green check.
