# Load Submitted Bracket Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user navigates to `/brackets/edit` after submitting a bracket, pre-populate the editor with their submitted picks and allow re-submission (upsert).

**Architecture:** Add `GET /brackets/mine` API endpoint that queries Firestore by `userId`. Update `submitBracket` to upsert (update existing or create new). Frontend `useBracket` hook loads existing bracket on mount and exposes `isLoading` state.

**Tech Stack:** NestJS API, React hooks, Firestore, Jest

**Spec:** `docs/superpowers/specs/2026-03-15-load-submitted-bracket-design.md`

---

## Chunk 1: API Changes

### Task 1: Add `findByUserId` to BracketsService

**Files:**
- Modify: `apps/api/src/brackets/brackets.service.ts`
- Test: `apps/api/src/brackets/brackets.service.spec.ts`

- [ ] **Step 1: Write the failing test for `findByUserId`**

Add to `apps/api/src/brackets/brackets.service.spec.ts` — a new `describe('findByUserId')` block. The existing test file mocks Firestore with `mockCollection`, `mockDoc`, `mockGet`, `mockSet`. You need to add a `mockWhere`, `mockLimit`, and `mockQueryGet` mock for Firestore queries.

Add these mocks near the top of the file, alongside the existing `mockSet`/`mockGet`/`mockDoc`/`mockCollection` declarations:

```typescript
const mockQueryGet = jest.fn();
const mockLimit = jest.fn(() => ({
  get: mockQueryGet,
}));
const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));
```

Update the existing `mockCollection` mock to also return `where`:

```typescript
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
}));
```

Then add the test:

```typescript
describe('findByUserId', () => {
  it('should return the bracket document when one exists', async () => {
    mockQueryGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'bracket-abc',
          data: () => ({
            bracketName: 'Test Bracket',
            userId: 'user-123',
            picks: { R1_M0: '1', R1_M1: '2' },
            teams: [],
            createdAt: '2026-03-15T00:00:00Z',
            updatedAt: '2026-03-15T00:00:00Z',
          }),
        },
      ],
    });

    const result = await service.findByUserId('user-123');

    expect(mockCollection).toHaveBeenCalledWith('brackets');
    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      id: 'bracket-abc',
      bracketName: 'Test Bracket',
      userId: 'user-123',
      picks: { R1_M0: '1', R1_M1: '2' },
      teams: [],
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    });
  });

  it('should return null when no bracket exists for user', async () => {
    mockQueryGet.mockResolvedValue({
      empty: true,
      docs: [],
    });

    const result = await service.findByUserId('user-no-bracket');

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx nx run api:test -- --testPathPattern=brackets.service`
Expected: FAIL — `findByUserId` is not a function

- [ ] **Step 3: Implement `findByUserId` in BracketsService**

Add this method to `apps/api/src/brackets/brackets.service.ts`:

```typescript
async findByUserId(uid: string): Promise<BracketDocument | null> {
  const snapshot = await getFirestore()
    .collection('brackets')
    .where('userId', '==', uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...(doc.data() as Omit<BracketDocument, 'id'>),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx nx run api:test -- --testPathPattern=brackets.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/brackets/brackets.service.ts apps/api/src/brackets/brackets.service.spec.ts
git commit -m "feat(api): add findByUserId method to BracketsService"
```

---

### Task 2: Update `submitBracket` to upsert

**Files:**
- Modify: `apps/api/src/brackets/brackets.service.ts`
- Test: `apps/api/src/brackets/brackets.service.spec.ts`

- [ ] **Step 1: Write the failing tests for upsert behavior**

Add a `describe('submitBracket')` block to the service spec. You need a `mockUpdate` mock added alongside the existing mocks:

```typescript
const mockUpdate = jest.fn();
```

Update `mockDoc` to also return `update`:

```typescript
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  update: mockUpdate,
  id: 'new-bracket-id',
}));
```

Then add these tests:

```typescript
describe('submitBracket', () => {
  const submission = {
    bracketName: 'Test Bracket',
    picks: { R1_M0: 1, R1_M1: 2 } as Record<string, number | null>,
  };

  it('should create a new bracket when none exists for the user', async () => {
    mockQueryGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await service.submitBracket('user-123', submission);

    expect(mockSet).toHaveBeenCalledWith({
      bracketName: 'Test Bracket',
      userId: 'user-123',
      picks: { R1_M0: '1', R1_M1: '2' },
      teams: [],
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    });
    expect(result).toBe('new-bracket-id');
  });

  it('should update the existing bracket when one exists', async () => {
    mockQueryGet.mockResolvedValue({
      empty: false,
      docs: [{ id: 'existing-bracket-id', data: () => ({}) }],
    });

    const result = await service.submitBracket('user-456', submission);

    expect(mockDoc).toHaveBeenCalledWith('existing-bracket-id');
    expect(mockUpdate).toHaveBeenCalledWith({
      picks: { R1_M0: '1', R1_M1: '2' },
      updatedAt: 'SERVER_TIMESTAMP',
    });
    expect(result).toBe('existing-bracket-id');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx nx run api:test -- --testPathPattern=brackets.service`
Expected: FAIL — current `submitBracket` always creates new docs and doesn't query first

- [ ] **Step 3: Update `submitBracket` to use upsert logic**

Replace the `submitBracket` method in `apps/api/src/brackets/brackets.service.ts`:

```typescript
async submitBracket(uid: string, submission: BracketSubmission): Promise<string> {
  const db = getFirestore();

  const picks: Record<string, string> = {};
  for (const [key, value] of Object.entries(submission.picks)) {
    if (value != null) {
      picks[key] = String(value);
    }
  }

  const existing = await this.findByUserId(uid);

  if (existing?.id) {
    const docRef = db.collection('brackets').doc(existing.id);
    await docRef.update({
      picks,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return existing.id;
  }

  const docRef = db.collection('brackets').doc();
  await docRef.set({
    bracketName: submission.bracketName,
    userId: uid,
    picks,
    teams: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx nx run api:test -- --testPathPattern=brackets.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/brackets/brackets.service.ts apps/api/src/brackets/brackets.service.spec.ts
git commit -m "feat(api): update submitBracket to upsert existing bracket"
```

---

### Task 3: Add `GET /brackets/mine` controller endpoint

**Files:**
- Modify: `apps/api/src/brackets/brackets.controller.ts`
- Test: `apps/api/src/brackets/brackets.controller.spec.ts`

**Important:** The `mine` route must be declared BEFORE the `:bracketId` route in the controller, otherwise NestJS will match `mine` as a `bracketId` parameter.

- [ ] **Step 1: Write the failing tests**

Update the mock service in the controller spec to include `findByUserId`:

```typescript
service = {
  joinBracket: jest.fn(),
  findByUserId: jest.fn(),
} as unknown as jest.Mocked<BracketsService>;
```

Add a `describe('getMyBracket')` block:

```typescript
describe('getMyBracket', () => {
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as import('express').Response;

  it('should return the bracket when one exists', async () => {
    const bracket = {
      id: 'bracket-abc',
      bracketName: 'My Bracket',
      userId: 'user-123',
      picks: { R1_M0: '1' },
      teams: [],
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    };
    service.findByUserId.mockResolvedValue(bracket);

    await controller.getMyBracket(mockUser, mockRes);

    expect(service.findByUserId).toHaveBeenCalledWith('user-123');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: bracket,
      }),
    );
  });

  it('should return 404 when no bracket exists', async () => {
    service.findByUserId.mockResolvedValue(null);

    await controller.getMyBracket(mockUser, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'BRACKET_NOT_FOUND', message: 'Bracket not found' },
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx nx run api:test -- --testPathPattern=brackets.controller`
Expected: FAIL — `getMyBracket` is not a function

- [ ] **Step 3: Add the `getMyBracket` endpoint to the controller**

Add the following method to `BracketsController` in `apps/api/src/brackets/brackets.controller.ts`. **Place it ABOVE the existing `@Get(':bracketId')` method** so NestJS doesn't match `mine` as a bracketId:

```typescript
@Get('mine')
@UseGuards(AuthGuard)
@ApiOperation({ summary: 'Get the current user\'s bracket' })
@SwaggerResponse({ status: 200, description: 'Returns the user\'s bracket' })
@SwaggerResponse({ status: 404, description: 'No bracket found for user' })
async getMyBracket(@CurrentUser() user: AuthUser, @Res() res: Response): Promise<void> {
  const bracket = await this.bracketsService.findByUserId(user.uid);

  if (!bracket) {
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: {
        code: 'BRACKET_NOT_FOUND',
        message: 'Bracket not found',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
    return;
  }

  const response: ApiResponse<BracketDocument> = {
    success: true,
    data: bracket,
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx nx run api:test -- --testPathPattern=brackets.controller`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/brackets/brackets.controller.ts apps/api/src/brackets/brackets.controller.spec.ts
git commit -m "feat(api): add GET /brackets/mine endpoint"
```

---

## Chunk 2: Frontend Changes

### Task 4: Add `fetchMyBracket` API function

**Files:**
- Modify: `apps/web/src/features/bracket/api/bracket-api.ts`

- [ ] **Step 1: Add the `fetchMyBracket` function**

In `apps/web/src/features/bracket/api/bracket-api.ts`, update imports and add the function.

Replace line 1:
```typescript
// FROM:
import type { ApiResponse, BracketSubmission } from '@movable-madness/shared-types';
// TO:
import type { ApiResponse, BracketDocument, BracketSubmission } from '@movable-madness/shared-types';
```

Replace line 2:
```typescript
// FROM:
import { post } from '../../../shared/api/api-client';
// TO:
import { get, post } from '../../../shared/api/api-client';
```

Add after the existing `submitBracket` function:
```typescript
export function fetchMyBracket(): Promise<ApiResponse<BracketDocument>> {
  return get('/brackets/mine');
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/api/bracket-api.ts
git commit -m "feat(web): add fetchMyBracket API function"
```

---

### Task 5: Update `useBracket` hook to load existing bracket

**Files:**
- Modify: `apps/web/src/features/bracket/model/use-bracket.ts`

- [ ] **Step 1: Add loading state and fetch logic**

Update `apps/web/src/features/bracket/model/use-bracket.ts`:

Update imports in `apps/web/src/features/bracket/model/use-bracket.ts`:

Replace line 2:
```typescript
// FROM:
import { useCallback, useMemo, useState } from 'react';
// TO:
import { useCallback, useEffect, useMemo, useState } from 'react';
```

Replace line 3:
```typescript
// FROM:
import { submitBracket as apiSubmitBracket } from '../api/bracket-api';
// TO:
import { fetchMyBracket, submitBracket as apiSubmitBracket } from '../api/bracket-api';
```

Then:
1. Add `isLoading` state
2. Add `useEffect` to fetch existing bracket on mount
3. Add `isLoading` to the return interface and return value

The conversion function to add at module level above `useBracket`:

```typescript
function convertStoredPicks(storedPicks: Record<string, string>): BracketPicks {
  const picks = createEmptyPicks();
  for (const [key, value] of Object.entries(storedPicks)) {
    if (key in picks) {
      const num = Number(value);
      picks[key] = Number.isNaN(num) ? null : num;
    }
  }
  return picks;
}
```

The `useEffect` to add after the state declarations:

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  let cancelled = false;

  fetchMyBracket()
    .then((response) => {
      if (!cancelled && response.data) {
        setPicks(convertStoredPicks(response.data.picks));
      }
    })
    .catch(() => {
      // 404 or network error — fall back to empty picks
    })
    .finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, []);
```

Add `isLoading` to the `UseBracketReturn` interface:

```typescript
interface UseBracketReturn {
  // ... existing fields ...
  isLoading: boolean;
}
```

And to the return object:

```typescript
return {
  // ... existing fields ...
  isLoading,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/model/use-bracket.ts
git commit -m "feat(web): load existing bracket in useBracket hook"
```

---

### Task 6: Update `BracketEditorContent` to handle loading state

**Files:**
- Modify: `apps/web/src/features/bracket/ui/bracket-editor-page.tsx`

- [ ] **Step 1: Add loading state handling**

In `BracketEditorContent`, destructure `isLoading` from the `useBracket` hook:

```typescript
const {
  picks,
  selectWinner,
  getTeams,
  picksCount,
  isComplete,
  submitBracket,
  isSubmitting,
  submitError,
  isSubmitted,
  isLoading,
} = useBracket({ bracketName });
```

Add a loading guard before the `isSubmitted` check:

```typescript
if (isLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading bracket...</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-editor-page.tsx
git commit -m "feat(web): show loading state while fetching existing bracket"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Run all API tests**

Run: `npx nx run api:test`
Expected: All tests pass

- [ ] **Step 2: Verify in browser**

1. Navigate to `http://localhost:4200/brackets/edit`
2. Fill out and submit a bracket
3. Navigate back to `http://localhost:4200/brackets/edit`
4. Verify the submitted picks are pre-populated
5. Modify a pick and re-submit
6. Navigate back and verify the updated picks appear
