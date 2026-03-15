# Setup Script API Enablement Fix

## Problem

Running the setup script (`pnpm setup`) on a fresh GCP project produces three errors because required APIs are not enabled before commands that depend on them:

1. **Service Account User role binding fails** — `gcloud iam service-accounts add-iam-policy-binding` targets the default Compute Engine SA (`{projectNumber}-compute@developer.gserviceaccount.com`), but that SA doesn't exist because `compute.googleapis.com` was never enabled.

2. **Artifact Registry repository creation fails** — `gcloud artifacts repositories create` fails with PERMISSION_DENIED because `artifactregistry.googleapis.com` is not enabled. The interactive "enable and retry?" prompt defaults to "N" in non-interactive mode.

3. **Cloud Run IAM binding fails** — `gcloud run services add-iam-policy-binding` fails with PERMISSION_DENIED because `run.googleapis.com` is not enabled. Same interactive prompt issue.

## Design

### Approach: Add missing API enables to Step 0 + SA propagation wait

All changes are in `tools/scripts/setup-project.ts`.

### Change 1: Enable three APIs in Step 0

Add these three `gcloud services enable` calls alongside the existing `iamcredentials.googleapis.com` enable (~line 398):

- `compute.googleapis.com` — triggers creation of the default Compute Engine service account
- `artifactregistry.googleapis.com` — required for repository creation
- `run.googleapis.com` — required for Cloud Run IAM binding

### Change 2: Wait for default Compute Engine SA

After enabling `compute.googleapis.com`, the default SA is created asynchronously. Add a polling loop before the Step 6 IAM binding that:

- Checks for SA existence via `gcloud iam service-accounts describe`
- Polls every 5 seconds, up to 60 seconds
- Logs progress so the user knows what's happening
- Fails gracefully with a message if the SA doesn't appear in time

### Change 3: None

No other changes needed. The Artifact Registry and Cloud Run commands work once their APIs are enabled — no retry logic required for those.
