# Feature Specification: Postman Collection Generator from OpenAPI

**Feature Branch**: `004-postman-openapi-sync`
**Created**: 2026-01-11
**Status**: Draft
**Input**: User description: "I want to create a robust script that generates postman environments and collections from the OpenAPI/Swagger implementation in the NestJS app. This workflow should be as implicit as possible, I want to be able to quickly update the postman collection after adding a new endpoint, then be able to test new endpoint in postman with as little effort as possible"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Collection Update After Adding Endpoint (Priority: P1)

As a developer, after adding a new API endpoint to the application, I want to regenerate my Postman collection with a single command so that I can immediately test the new endpoint in Postman without manual configuration.

**Why this priority**: This is the core value proposition - minimizing the time between adding an endpoint and being able to test it. Every other feature depends on this working seamlessly.

**Independent Test**: Can be fully tested by adding a sample endpoint, running the generation command, and verifying the new endpoint appears in Postman ready to use.

**Acceptance Scenarios**:

1. **Given** a developer has added a new endpoint to the application, **When** they run the collection generation command, **Then** the updated collection includes the new endpoint with correct request details
2. **Given** a developer has modified an existing endpoint's parameters, **When** they regenerate the collection, **Then** the collection reflects the updated parameters without losing any custom test scripts or saved responses

---

### User Story 2 - Environment-Aware Testing (Priority: P2)

As a developer, I want automatically generated environment files for different deployment targets (local, staging, production) so that I can switch between environments in Postman without manually editing URLs or credentials.

**Why this priority**: Environment configuration is essential for real-world testing scenarios, but the core collection generation must work first.

**Independent Test**: Can be tested by generating environments and verifying that switching environments in Postman correctly updates all request URLs and variables.

**Acceptance Scenarios**:

1. **Given** the application has multiple deployment environments configured, **When** the developer generates environments, **Then** separate Postman environment files are created for each target
2. **Given** an environment file exists, **When** the developer selects it in Postman, **Then** all requests automatically use the correct base URL and environment-specific variables

---

### User Story 3 - Seamless Import Experience (Priority: P3)

As a developer, I want the generated collection to be immediately usable in Postman so that I can start testing without additional setup steps.

**Why this priority**: While not blocking core functionality, a smooth import experience significantly improves developer satisfaction and adoption.

**Independent Test**: Can be tested by importing a generated collection into a fresh Postman workspace and verifying all endpoints are executable.

**Acceptance Scenarios**:

1. **Given** a generated collection file, **When** the developer imports it into Postman, **Then** all endpoints are organized in logical folders matching the API structure
2. **Given** an endpoint requires authentication, **When** the developer views it in Postman, **Then** the authentication method is pre-configured using environment variables

---

### Edge Cases

- What happens when the API specification is malformed or incomplete?
- How does the system handle endpoints with complex nested request bodies?
- What happens when an endpoint is removed from the API - is it removed from the collection or preserved?
- How are authentication requirements detected and configured?
- What happens when the generation process is run but no changes exist?

## Requirements *(mandatory)*

### Functional Requirements

**OpenAPI Auto-Generation (NestJS Swagger)**:
- **FR-001**: NestJS API MUST expose an auto-generated OpenAPI specification via Swagger decorators
- **FR-002**: All API endpoints MUST be decorated with appropriate Swagger metadata (operation summary, request/response schemas)
- **FR-003**: OpenAPI spec MUST be exportable to a file via build-time script (no running server required)
- **FR-004**: NestJS API MUST serve Swagger UI at `/api-docs` in development mode for interactive API exploration

**Postman Collection Generation**:
- **FR-005**: System MUST generate a Postman collection file from the auto-generated OpenAPI specification
- **FR-006**: System MUST generate Postman environment files for each configured deployment target
- **FR-007**: System MUST preserve the folder structure that reflects the API's logical organization (by tags)
- **FR-008**: System MUST include all endpoint metadata including HTTP method, path, query parameters, headers, and request body schemas
- **FR-009**: System MUST configure authentication settings using environment variables
- **FR-010**: System MUST be executable with a single command from the project root (generates OpenAPI spec and Postman collection in one step)
- **FR-011**: System MUST provide clear error messages when the API specification cannot be parsed
- **FR-012**: System MUST perform a full overwrite of the collection file on each generation (custom scripts added in Postman will not be preserved)
- **FR-013**: System MUST generate example request bodies based on schema definitions
- **FR-014**: System MUST output files in standard Postman collection format (v2.1)

### Key Entities

- **Collection**: The complete set of API endpoints organized into folders, including request definitions and metadata
- **Environment**: A set of variables specific to a deployment target (URLs, authentication tokens, configuration values)
- **Endpoint**: A single API operation with its method, path, parameters, and expected responses
- **Folder**: A logical grouping of related endpoints within the collection

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can update Postman collection within 30 seconds of adding a new endpoint
- **SC-002**: 100% of documented API endpoints are represented in the generated collection
- **SC-003**: Generated collection is importable into Postman without errors on first attempt
- **SC-004**: Environment switching requires zero manual URL edits - all requests work correctly after selecting an environment
- **SC-005**: New team members can begin API testing within 5 minutes of cloning the repository
- **SC-006**: Collection regeneration preserves 100% of endpoint coverage even when API specification changes

## Assumptions

- Developers have Postman installed and are familiar with basic Postman usage
- Environment-specific configuration (URLs, ports) is available or can be derived from project configuration
- Authentication tokens will be manually configured in Postman environments (not auto-generated)

## Clarifications

### Session 2026-01-11

- Q: Should the OpenAPI spec be auto-generated from NestJS decorators or manually maintained? → A: Auto-generate from NestJS Swagger decorators
- Q: How should Postman generation script access the OpenAPI spec? → A: Generate spec file at build time via npm script (no server needed)
- Q: Single command or separate commands? → A: Single command does both (generate OpenAPI spec + generate Postman collection)
- Q: Should NestJS serve Swagger UI for development? → A: Yes, serve at `/api-docs` in development mode
- Q: Is NestJS Swagger setup included in scope? → A: Yes, install @nestjs/swagger, configure SwaggerModule, decorate all endpoints
