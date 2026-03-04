# Quickstart: Admin User Seeding & CASL-Based RBAC

**Feature Branch**: `005-admin-rbac-casl`

## Prerequisites

- Firebase project configured (via `pnpm run setup`)
- `gcloud` CLI installed
- Node.js 18+, pnpm 9+

## Setup Steps

### 1. Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

This creates ADC credentials that the seeding script uses to access Firebase.

### 2. Seed Admin User

```bash
pnpm run seed:admin
```

The script will:
1. Display the target Firebase project ID
2. Ask for confirmation before proceeding
3. Create/update admin user in Firebase Auth with custom claims
4. Create/update user document in Firestore `/users/{uid}`

**Expected Output**:
```
Target Firebase project: your-project-id
Continue? (y/N): y
Checking for existing user...
Creating admin user...
Setting custom claims...
Creating Firestore document...
Admin user seeded successfully!
  Email: admin@admin.com
  UID: abc123xyz789
```

### 3. Start Development Servers

```bash
pnpm run dev
```

This starts both the API (port 3000) and web app (port 4200).

### 4. Sign In as Admin

1. Navigate to http://localhost:4200/sign-in
2. Enter credentials:
   - Email: `admin@admin.com`
   - Password: `admin123`
3. Click Sign In

## Testing the API

### Get Current User

```bash
# First, get a token (after signing in via the web app, copy from browser dev tools)
TOKEN="your-firebase-id-token"

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/me
```

### Protected Endpoints

```bash
# Requires admin role
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/users

# Without token - returns 401
curl http://localhost:3000/users

# With non-admin token - returns 403
curl -H "Authorization: Bearer $NON_ADMIN_TOKEN" http://localhost:3000/users
```

## Troubleshooting

### "Could not load the default credentials"

Run `gcloud auth application-default login` and try again.

### "User already exists"

The seeding script is idempotent. If the user exists, it updates custom claims instead.

### "Invalid API key"

Ensure Firebase is properly configured. Re-run `pnpm run setup` if needed.

### Token expired

Firebase ID tokens expire after 1 hour. Sign in again to get a fresh token.

## Adding New Roles

1. Add role to `libs/auth/src/lib/types/roles.ts`:
   ```typescript
   export const Roles = {
     ADMIN: 'admin',
     EDITOR: 'editor', // new
   } as const;
   ```

2. Define abilities in `libs/auth/src/lib/casl/ability.factory.ts`:
   ```typescript
   case Roles.EDITOR:
     can(Actions.READ, 'all');
     can(Actions.UPDATE, 'Post'); // example
     break;
   ```

3. Create a seeding script for the new role (optional).
