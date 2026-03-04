# Feature Specification: Admin User Seeding & CASL-Based RBAC

**Feature Branch**: `005-admin-rbac-casl`
**Created**: 2026-01-11
**Status**: Draft
**Input**: User description: "Create admin user seeding script and implement CASL-based RBAC with Firebase Auth custom claims"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin User Seeding (Priority: P1)

After running the project setup script, a developer runs an admin seeding script that creates an admin user in Firebase Auth with the email `admin@admin.com` and password `admin123`. The user is created with an `admin` custom claim in Firebase Auth and a corresponding user document in Firestore's `/users` collection.

**Why this priority**: This is the foundation for all other functionality. Without a seeded admin user, developers cannot test authentication flows or RBAC during development.

**Independent Test**: Can be fully tested by running the seeding script against a local Firebase emulator or development project and verifying the user exists in both Firebase Auth and Firestore with correct properties.

**Acceptance Scenarios**:

1. **Given** the setup script has been run and Firebase is configured, **When** developer runs `pnpm run seed:admin`, **Then** an admin user is created in Firebase Auth with email `admin@admin.com`, password `admin123`, and custom claim `{ role: "admin" }`.

2. **Given** the admin user is created in Firebase Auth, **When** the seeding script completes, **Then** a user document exists at `/users/{uid}` in Firestore containing at minimum `{ email, role, createdAt }`.

3. **Given** an admin user already exists with the same email, **When** developer runs the seeding script again, **Then** the script either updates the existing user or skips creation with an informative message (idempotent operation).

---

### User Story 2 - Admin Signs Into Web App (Priority: P1)

A developer uses the seeded admin credentials to sign into the web application and receives appropriate authentication tokens that include their admin role claim.

**Why this priority**: Equal priority to seeding because authentication is required to test the RBAC system.

**Independent Test**: Can be tested by navigating to the sign-in page, entering `admin@admin.com` / `admin123`, and verifying successful authentication with admin role visible in the user context.

**Acceptance Scenarios**:

1. **Given** the admin user has been seeded, **When** admin enters `admin@admin.com` and `admin123` on the sign-in form, **Then** they are authenticated successfully.

2. **Given** admin is authenticated, **When** their ID token is decoded, **Then** it contains the custom claim `{ role: "admin" }`.

3. **Given** admin is authenticated, **When** they make API requests, **Then** the Authorization header contains a valid Firebase ID token.

---

### User Story 3 - RBAC Protects API Endpoints (Priority: P1)

The NestJS API uses CASL to enforce role-based access control. Admin users have full access to all resources, while unauthenticated or unauthorized users are denied access to protected endpoints.

**Why this priority**: Core security requirement that must be in place before any protected endpoints are added.

**Independent Test**: Can be tested by making authenticated requests with admin credentials and verifying access is granted, then making unauthenticated requests and verifying access is denied with appropriate error responses.

**Acceptance Scenarios**:

1. **Given** a protected API endpoint exists, **When** an unauthenticated user makes a request, **Then** they receive a 401 Unauthorized response.

2. **Given** a protected API endpoint exists, **When** an authenticated admin makes a request, **Then** they receive the expected successful response.

3. **Given** a protected API endpoint with role requirements, **When** an authenticated user without the required role makes a request, **Then** they receive a 403 Forbidden response.

---

### User Story 4 - Extensible RBAC for Future Roles (Priority: P2)

The RBAC system is designed to be easily extensible. New roles (e.g., "editor", "viewer") can be added by defining new ability configurations without modifying core authorization infrastructure.

**Why this priority**: Important for scaffold reusability but not blocking for initial functionality.

**Independent Test**: Can be tested by adding a new role definition and verifying the ability factory correctly produces permissions for that role.

**Acceptance Scenarios**:

1. **Given** the CASL ability factory exists, **When** a developer adds a new role definition, **Then** they only need to modify the role-to-permissions mapping without changing guards or decorators.

2. **Given** the RBAC system is implemented, **When** reviewing the code, **Then** clear documentation and examples exist for adding new roles.

---

### Edge Cases

- What happens when Firebase Auth is unavailable during seeding? Script should fail gracefully with clear error message.
- What happens when the admin user's custom claims are out of sync with Firestore? Firebase Auth claims are the source of truth; Firestore document is for additional profile data only.
- How does the system handle expired or revoked tokens? Returns 401 and requires re-authentication.
- What happens when seeding script is run against wrong project? Script displays target project ID and requires explicit confirmation before proceeding.

## Requirements *(mandatory)*

### Functional Requirements

**Admin Seeding Script**

- **FR-001**: System MUST provide a `seed:admin` npm script that creates an admin user in Firebase Auth and Firestore.
- **FR-002**: The seeding script MUST create a Firebase Auth user with email `admin@admin.com` and password `admin123`.
- **FR-003**: The seeding script MUST set a custom claim `{ role: "admin" }` on the Firebase Auth user.
- **FR-004**: The seeding script MUST create a user document in Firestore at `/users/{uid}` with `email`, `role`, and `createdAt` fields.
- **FR-005**: The seeding script MUST be idempotent (safe to run multiple times without errors).
- **FR-006**: The seeding script MUST use Application Default Credentials (ADC) for authentication, requiring developers to run `gcloud auth application-default login` before executing.
- **FR-007**: The seeding script MUST log clear status messages indicating success or failure.
- **FR-008**: The seeding script MUST display the target Firebase project ID and require explicit user confirmation before creating/modifying any data.

**Authentication Integration**

- **FR-009**: The NestJS API MUST verify Firebase ID tokens from the Authorization header.
- **FR-010**: The NestJS API MUST extract user information and custom claims from verified tokens.
- **FR-011**: The NestJS API MUST return 401 Unauthorized for missing or invalid tokens on protected endpoints.

**CASL RBAC Implementation**

- **FR-012**: System MUST implement CASL for ability-based authorization.
- **FR-013**: System MUST provide decorators or guards for protecting API endpoints.
- **FR-014**: The admin role MUST have full access to all actions on all subjects ("manage all").
- **FR-015**: System MUST return 403 Forbidden when a user lacks required permissions.
- **FR-016**: The ability factory MUST be configurable to add new roles without modifying core infrastructure.

**Web App Authentication**

- **FR-017**: The web app MUST provide a sign-in form accepting email and password.
- **FR-018**: The web app MUST use Firebase Authentication client SDK for sign-in.
- **FR-019**: The web app MUST include the Firebase ID token in API request Authorization headers.

### Key Entities

- **User**: Represents an authenticated user. Key attributes: uid (Firebase Auth UID), email, role, createdAt. Stored in both Firebase Auth (identity) and Firestore `/users` collection (profile data).

- **Role**: Defines a user's permission level. Initially only "admin" is defined. Stored as a custom claim in Firebase Auth (`role: "admin"`).

- **Ability**: CASL ability object defining what actions a user can perform on which subjects. Dynamically generated based on user's role.

### Assumptions

- Firebase project is already configured via the existing setup script.
- Firebase Authentication and Firestore are enabled in the Firebase project.
- Developers have `gcloud` CLI installed and can authenticate via `gcloud auth application-default login`.
- The scaffold will include basic authentication UI (sign-in form) but not full user management (registration, password reset, etc.).
- Claims source of truth is Firebase Auth; Firestore stores supplementary profile data and the role field is included for query convenience only.

## Clarifications

### Session 2026-01-11

- Q: How does the seeding script authenticate to Firebase Auth and Firestore? → A: Uses Application Default Credentials (ADC) via `gcloud auth application-default login`. Script targets real Firebase project, not emulators. No service account JSON file required for local development.
- Q: What safeguard prevents accidental seeding in production? → A: Script displays target Firebase project ID and requires explicit confirmation before proceeding.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can run setup script followed by `pnpm run seed:admin` and have a working admin user within 30 seconds.

- **SC-002**: Admin user can sign in with `admin@admin.com` / `admin123` and make authenticated API requests successfully.

- **SC-003**: Protected API endpoints return 401 for unauthenticated requests and 200 for authenticated admin requests 100% of the time.

- **SC-004**: Adding a new role requires changes to only 1-2 files (role definition and ability mapping).

- **SC-005**: Seeding script can be run multiple times without errors or duplicate user creation.

- **SC-006**: Seeding script works against real Firebase project using Application Default Credentials without requiring a service account JSON file.
