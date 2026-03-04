# Research: Admin User Seeding & CASL-Based RBAC

**Feature Branch**: `005-admin-rbac-casl`
**Date**: 2026-01-11

## Research Questions

1. CASL integration with NestJS
2. Firebase Admin SDK for user creation and custom claims
3. Firebase Auth client SDK for React
4. ADC authentication pattern

---

## 1. CASL Integration with NestJS

### Decision: Use @casl/ability with custom guards

**Rationale**: The core `@casl/ability` package provides full flexibility without adding unnecessary abstraction layers. The `nest-casl` community package adds GraphQL-specific features we don't need.

**Alternatives Considered**:
- `nest-casl` (1.9.15) - Adds decorators and guards but couples to GraphQL patterns
- `@knodes/nest-casl` - Requires older CASL v5

### Key Packages

| Package | Version | Purpose |
|---------|---------|---------|
| @casl/ability | 6.7.5 | Core authorization library |

### Implementation Patterns

**Ability Factory Pattern**:
- Create injectable `CaslAbilityFactory` service
- Use `createMongoAbility` with `AbilityBuilder`
- Define permissions based on user role using `can()` and `cannot()`
- Return built ability

**Standard Actions**:
- `read` - View resources
- `create` - Create resources
- `update` - Modify resources
- `delete` - Remove resources
- `manage` - Special "any action" for superusers

**Guard Pattern**:
- Create `CheckPolicies` decorator using `SetMetadata`
- Implement `PoliciesGuard` that:
  1. Retrieves policy handlers from route metadata via `Reflector`
  2. Extracts user from request
  3. Creates ability using factory
  4. Executes policy handlers

**Best Practices**:
- Use `manage` + `all` for admin role (full access)
- Default deny for unrecognized roles
- Rule order matters: `cannot` rules after broad `can` rules

---

## 2. Firebase Admin SDK

### Decision: Use firebase-admin with ADC

**Rationale**: ADC eliminates need for service account JSON files in development. The project already has `firebase-admin` 13.x installed.

### Key Methods

**User Creation**:
```typescript
getAuth().createUser({
  email: string,
  password: string,
  emailVerified?: boolean,
  displayName?: string,
  disabled?: boolean
}) // Returns UserRecord
```

**Custom Claims**:
```typescript
getAuth().setCustomUserClaims(uid, { role: 'admin' })
```
- Max 1000 bytes payload
- Propagates on next token refresh
- Cannot use reserved claim names

**User Lookup**:
```typescript
getAuth().getUserByEmail(email) // Returns UserRecord or throws auth/user-not-found
```

**Token Verification**:
```typescript
getAuth().verifyIdToken(idToken, checkRevoked?) // Returns DecodedIdToken
```
- `checkRevoked: true` for sensitive operations
- Returns `uid`, `email`, custom claims

### Idempotent Seeding Pattern

1. Try `getUserByEmail(email)`
2. If `auth/user-not-found`, create new user
3. If exists, optionally update custom claims
4. Always ensure Firestore user document exists

### ADC Setup

**Initialization**:
```typescript
import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
  projectId: '<FIREBASE_PROJECT_ID>',
});
```

**Local Development**: Run `gcloud auth application-default login` before executing scripts

---

## 3. Firebase Auth Client SDK for React

### Decision: Use firebase package with modular imports

**Rationale**: Standard approach using `firebase/auth` with modular tree-shakeable imports.

### Key Package

| Package | Purpose |
|---------|---------|
| firebase | Firebase client SDK (includes auth, firestore, etc.) |

### Implementation Patterns

**Sign In**:
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
```

**Get ID Token**:
```typescript
const token = await auth.currentUser?.getIdToken(true); // true = force refresh
```

**Auth State Management**:
- Use `onAuthStateChanged` listener in React Context
- Track loading state until initial auth check completes
- Return unsubscribe function from useEffect

**Access Custom Claims**:
```typescript
const idTokenResult = await user.getIdTokenResult();
const role = idTokenResult.claims.role; // 'admin'
```

**Important**: Client-side claims are for UX only. Always validate on backend.

---

## 4. Project Confirmation Safeguard

### Decision: Display project ID and require explicit confirmation

**Rationale**: Prevents accidental seeding of production database.

**Pattern**:
1. Log target project ID from ADC
2. Prompt user with "Continue? (y/N)"
3. Only proceed with explicit "y" confirmation

---

## Dependencies to Install

### API (apps/api)
```bash
pnpm add @casl/ability
```

### Web (apps/web)
```bash
pnpm add firebase
```

### Root (for seeding script)
Already has: `firebase-admin`, `prompts`

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Which CASL package? | @casl/ability 6.7.5 (core package, no wrappers) |
| How to authenticate seeding script? | ADC via `gcloud auth application-default login` |
| How to make seeding idempotent? | Check `getUserByEmail` first, create or update |
| How to access claims on client? | `getIdTokenResult().claims` |
