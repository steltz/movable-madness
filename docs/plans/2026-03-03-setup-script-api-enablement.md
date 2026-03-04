# Setup Script API Enablement Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three errors when running the setup script on a fresh GCP project by enabling required APIs before commands that depend on them.

**Architecture:** Add three `gcloud services enable` calls to the existing Step 0 API enablement block, and add a polling loop to wait for the default Compute Engine service account to be provisioned before the IAM binding that targets it.

**Tech Stack:** TypeScript (Node.js), `execSync` for shell commands, `gcloud` CLI

---

### Task 1: Add missing API enables to Step 0

**Files:**
- Modify: `tools/scripts/setup-project.ts:398-402`

**Step 1: Add three API enable calls after the existing `iamcredentials` enable**

At line 402 (after the existing `runGcloudCommand` for `iamcredentials.googleapis.com`), add:

```typescript
  runGcloudCommand(
    `gcloud services enable compute.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Compute Engine API',
  );

  runGcloudCommand(
    `gcloud services enable artifactregistry.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Artifact Registry API',
  );

  runGcloudCommand(
    `gcloud services enable run.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Cloud Run API',
  );
```

**Step 2: Verify the change reads correctly**

Read lines 398-420 and confirm all four API enables are present in sequence under the `// Step 0: Enable required APIs` comment.

**Step 3: Commit**

```bash
git add tools/scripts/setup-project.ts
git commit -m "fix(setup): enable compute, artifactregistry, and run APIs in Step 0"
```

---

### Task 2: Add polling wait for default Compute Engine service account

**Files:**
- Modify: `tools/scripts/setup-project.ts:452-461`

**Step 1: Add a `waitForServiceAccount` helper function**

Add this function before the `setupWorkloadIdentityFederation` function (around line 119, after the `runGcloudCommand` helper):

```typescript
function waitForServiceAccount(
  serviceAccountEmail: string,
  projectId: string,
  maxWaitSeconds = 60,
  intervalSeconds = 5,
): boolean {
  console.log(`  Waiting for service account ${serviceAccountEmail} to be provisioned...`);
  const maxAttempts = Math.ceil(maxWaitSeconds / intervalSeconds);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync(
        `gcloud iam service-accounts describe "${serviceAccountEmail}" --project="${projectId}"`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
      console.log(`  ✓ Service account is ready`);
      return true;
    } catch {
      if (attempt < maxAttempts) {
        console.log(`    Attempt ${attempt}/${maxAttempts} - not yet available, retrying in ${intervalSeconds}s...`);
        execSync(`sleep ${intervalSeconds}`);
      }
    }
  }
  console.log(`  ✗ Service account did not become available within ${maxWaitSeconds}s`);
  return false;
}
```

**Step 2: Use `waitForServiceAccount` before the Step 6 IAM binding**

Replace the existing Step 6 block (lines 452-461) with:

```typescript
  // Step 6: Grant Service Account User role on compute service account
  // This allows the GitHub Actions SA to deploy Cloud Run services that run as the default compute SA
  const computeServiceAccount = `${projectNumber}-compute@developer.gserviceaccount.com`;
  const saReady = waitForServiceAccount(computeServiceAccount, config.gcpProjectId);
  if (saReady) {
    runGcloudCommand(
      `gcloud iam service-accounts add-iam-policy-binding "${computeServiceAccount}" ` +
        `--project="${config.gcpProjectId}" ` +
        `--role="roles/iam.serviceAccountUser" ` +
        `--member="serviceAccount:${serviceAccount}"`,
      'Granting Service Account User role on compute service account',
    );
  } else {
    console.log('  ⓘ Skipping Service Account User role binding - compute SA not yet available.');
    console.log('    Run this command manually after Compute Engine API has fully provisioned:');
    console.log(
      `    gcloud iam service-accounts add-iam-policy-binding "${computeServiceAccount}" \\`,
    );
    console.log(`      --project="${config.gcpProjectId}" \\`);
    console.log(`      --role="roles/iam.serviceAccountUser" \\`);
    console.log(`      --member="serviceAccount:${serviceAccount}"\n`);
  }
```

**Step 3: Verify the change reads correctly**

Read the modified sections and confirm:
- The helper function is defined
- Step 6 waits for the SA before attempting the binding
- The fallback provides a manual command

**Step 4: Commit**

```bash
git add tools/scripts/setup-project.ts
git commit -m "fix(setup): wait for compute SA before IAM binding in Step 6"
```

---

### Task 3: Handle Cloud Run API in `setupCloudRunIam`

**Files:**
- Modify: `tools/scripts/setup-project.ts:807-819`

**Step 1: Add PERMISSION_DENIED handling to the catch block**

The existing catch block at line 811 already handles `NOT_FOUND` (service not deployed). Add a check for `PERMISSION_DENIED` or `has not been used` so the error message is informative rather than cryptic. Since we now enable `run.googleapis.com` in Step 0, this is a safety net.

In the `setupCloudRunIam` catch block, after the `NOT_FOUND` check (line 813), add an `else if` for the API-not-enabled case:

```typescript
    } else if (stderr.includes('PERMISSION_DENIED') || stderr.includes('has not been used')) {
      console.log('  ⓘ Cloud Run IAM skipped - Cloud Run API may still be propagating');
      console.log('    Run this command manually when ready:');
      console.log(`    ${iamCommand.replace(/ --/g, ' \\\n      --')}\n`);
```

**Step 2: Verify the change reads correctly**

Read lines 807-825 and confirm the three error cases are handled: NOT_FOUND, PERMISSION_DENIED, and generic failure.

**Step 3: Commit**

```bash
git add tools/scripts/setup-project.ts
git commit -m "fix(setup): handle API-not-ready error in Cloud Run IAM setup"
```

---

### Task 4: Update manual instructions in summary output

**Files:**
- Modify: `tools/scripts/setup-project.ts:1264-1267`

**Step 1: Add the three new API enables to the manual instructions section**

The script prints manual instructions at the end if automated steps failed. Update the API enable section (around line 1265) to include all four APIs:

```typescript
    console.log(`   # Enable required APIs
   gcloud services enable iamcredentials.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable compute.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable artifactregistry.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable run.googleapis.com --project="${config.gcpProjectId}"
`);
```

**Step 2: Verify the manual instructions include all four APIs**

Read the relevant section and confirm.

**Step 3: Commit**

```bash
git add tools/scripts/setup-project.ts
git commit -m "fix(setup): include all APIs in manual instructions output"
```
