# Appwrite SDK v24.0.0 Migration Guide

## Overview
Updated all Appwrite data fetching and injection code to align with the new Appwrite SDK v24.0.0 documentation. The main change is the **removal of array wrappers** in Query functions.

## Key Changes

### 1. Query Parameter Syntax (🔴 BREAKING CHANGE)

**Old Syntax (Deprecated):**
```javascript
Query.equal("name", [value])        // Array wrapper
Query.equal("status", ["active"])   // Array wrapper
```

**New Syntax (Required):**
```javascript
Query.equal("name", value)          // Plain value
Query.equal("status", "active")     // Plain value
```

### 2. Files Updated

#### Backend Services

**[backend/services/teams.service.ts](backend/services/teams.service.ts)**
- ✅ Fixed: `Query.equal("name", [name])` → `Query.equal("name", name)`
- ✅ Fixed: `Query.equal("userId", [userId])` → `Query.equal("userId", userId)`
- ✅ Fixed: `Query.equal("status", ["active"])` → `Query.equal("status", "active")`
- ✅ Fixed: `Query.equal("teamId", [teamId])` → `Query.equal("teamId", teamId)`

**[backend/services/projects.service.ts](backend/services/projects.service.ts)**
- ✅ Fixed: `Query.equal("status", [input.status])` → `Query.equal("status", input.status)`
- ✅ Fixed: `Query.equal("teamId", [input.teamId])` → `Query.equal("teamId", input.teamId)`

**[backend/services/voting.service.ts](backend/services/voting.service.ts)**
- ✅ Fixed: `Query.equal("userId", [userId])` → `Query.equal("userId", userId)`
- ✅ Fixed: `Query.equal("projectId", [projectId])` → `Query.equal("projectId", projectId)`

#### Frontend Hooks

**[features/gallery/hooks/useArtifacts.ts](features/gallery/hooks/useArtifacts.ts)**
- ✅ Removed mock data that was bypassing the API
- ✅ Updated to properly handle API responses with error checking
- ✅ Ensured Content-Type header is included in requests

### 3. Document Structure (✅ VERIFIED)

Document creation continues to use plain JavaScript objects (correct approach):
```javascript
await databases.createDocument(databaseId, collectionId, docId, {
  name: "John Doe",        // Plain value, not in array
  email: "john@example.com",
  active: true,
  createdAt: now,
})
```

### 4. Attribute Types (✅ VERIFIED)

All collection attributes are now created as **non-array** types:
- `string` (not `string[]`)
- `boolean` (not `boolean[]`)
- This allows storing single values like `{"name": "John"}` not `{"name": ["John"]}`

### 5. Query Functions (✅ VERIFIED - NO CHANGES NEEDED)

These Query functions still work correctly and don't require array parameters:
- `Query.limit(n)` - ✅ Correct
- `Query.offset(n)` - ✅ Correct
- `Query.orderAsc("field")` - ✅ Correct
- `Query.orderDesc("field")` - ✅ Correct
- `Query.search("field", term)` - ✅ Correct

## Appwrite Collections Schema

### Teams Collection
| Attribute | Type | Indexed | Required |
|-----------|------|---------|----------|
| teamId | string | No | No |
| name | string | **Yes** | No |
| status | string | **Yes** | No |
| createdByUserId | string | No | No |
| createdAt | string | No | No |

### Users Collection
| Attribute | Type | Indexed | Required |
|-----------|------|---------|----------|
| userId | string | No | No |
| teamId | string | No | No |
| displayName | string | No | No |
| email | string | **Yes** | No |
| role | string | No | No |
| isRegistered | boolean | No | No |
| createdAt | string | No | No |
| updatedAt | string | No | No |

## Troubleshooting

### Error: "Cannot query equal on attribute X because it is an array"

**Cause:** The attribute was created with `array: true` in the schema

**Solution:** 
```bash
npm run cleanup:collections
npm run init:collections
```

This deletes and recreates your collections with correct attribute types.

### Error: "Unknown attribute: X"

**Cause:** Collection schema not initialized

**Solution:**
```bash
npm run init:collections
```

## Testing the Changes

1. ✅ **Collections Initialized** - All attributes are non-array types
2. ✅ **Query Syntax** - All `Query.equal()` calls use plain values (no arrays)
3. ✅ **Document Creation** - Using plain JavaScript objects
4. ✅ **Frontend Data Flow** - useArtifacts hook properly fetches and handles API responses
5. ✅ **Linting** - Code passes ESLint validation

## Migration Checklist

- [x] Update Query.equal() syntax (remove array wrappers)
- [x] Verify collection schema uses non-array attributes
- [x] Clean up frontend mock data
- [x] Verify document creation uses plain objects
- [x] Test error handling for schema initialization
- [x] Update documentation
- [x] Run linting and builds

## References

- **Appwrite Documentation**: https://appwrite.io/docs/references/cloud/server-nodejs/databases
- **Node-Appwrite SDK**: v24.0.0 (`node-appwrite`)
- **Collection Attributes Guide**: [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)
- **Event Registration Guide**: [docs/EVENT_REGISTRATION_GUIDE.md](docs/EVENT_REGISTRATION_GUIDE.md)
