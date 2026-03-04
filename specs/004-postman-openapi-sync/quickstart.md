# Quickstart: Postman Collection Generator

**Feature**: 004-postman-openapi-sync

## Prerequisites

- Node.js 18+
- pnpm 9+
- Postman desktop app (for importing collections)

## Installation

Dependencies are added during implementation:

```bash
pnpm add @nestjs/swagger swagger-ui-express
pnpm add -D openapi-to-postmanv2 js-yaml
```

## Usage

### Generate Collection and Environments

```bash
# From repository root
pnpm postman:generate
```

This generates the OpenAPI spec from NestJS decorators and creates:
```
apps/api/postman/
├── openapi.json              # Generated OpenAPI spec (intermediate)
├── collection.json           # Import this into Postman
└── environments/
    ├── local.json            # For local development
    ├── staging.json          # For staging environment
    └── production.json       # For production environment
```

### Import into Postman

1. Open Postman
2. Click **Import** (top-left)
3. Drag `apps/api/postman/collection.json` into the import window
4. Click **Import**
5. Go to **Environments** (gear icon, top-right)
6. Click **Import**
7. Select all files from `apps/api/postman/environments/`

### Switch Environments

1. Click the environment dropdown (top-right, next to the eye icon)
2. Select `Local Development`, `Staging`, or `Production`
3. All requests automatically use the correct `{{baseUrl}}`

### Test an Endpoint

1. Expand the collection in the sidebar
2. Click any request (e.g., "Get Health")
3. Click **Send**
4. View the response

## Workflow: After Adding a New Endpoint

1. Add your endpoint to the NestJS API in `apps/api/src/`
2. Decorate with Swagger annotations:
   ```typescript
   @ApiTags('users')
   @ApiOperation({ summary: 'Get user by ID' })
   @ApiResponse({ status: 200, description: 'User found' })
   @Get(':id')
   getUser(@Param('id') id: string) { ... }
   ```
3. Run `pnpm postman:generate`
4. Re-import the collection in Postman (overwrites existing)
5. Test your new endpoint

## Swagger UI (Development)

When running the API in development mode:
```bash
pnpm dev
```

Access interactive API docs at: http://localhost:3000/api-docs

## Authentication

The collection uses `{{accessToken}}` variable for Bearer authentication.

**To set your token:**
1. In Postman, go to the environment you're using
2. Find `accessToken` variable
3. Set the "Current Value" to your JWT token
4. All authenticated requests will use this token

## Troubleshooting

### "No endpoints in collection"

Ensure controllers are decorated with Swagger annotations:
```typescript
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Health check' })
  @Get('health')
  getHealth() { ... }
}
```

### "Conversion failed"

The OpenAPI spec may have validation errors. Check the error message for details on which schema or reference is invalid.

### Requests show `{{baseUrl}}` literally

You haven't selected an environment. Click the environment dropdown (top-right) and select one.
