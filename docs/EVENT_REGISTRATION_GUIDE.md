# Event Registration Setup & Test Guide

## Prerequisites

Before running the event registration flow, your Appwrite database must be initialized with the required schema.

### Step 1: Initialize Collections (REQUIRED)

```bash
npm run init:collections
```

**What this does:**
- Creates required attributes in Teams collection: `teamId`, `name`, `status`, `createdByUserId`, `createdAt`
- Creates required attributes in Users collection: `userId`, `teamId`, `displayName`, `email`, `role`, `isRegistered`, `createdAt`, `updatedAt`
- Sets up indexes for efficient queries

**Output should show:**
```
✓ Teams collection initialized
✓ Users collection initialized
✓ All collections initialized successfully
```

### Step 2: Verify Registration Flow

The complete event registration flow works as follows:

```
Frontend Form
  ├─ name: "Rounak Mondal"
  ├─ teamName: "FEYGDWHA"
  ├─ role: "LEADER"
  └─ gmail: "rabinmondal04m@gmail.com"
         ↓
POST /api/auth/register
         ↓
Backend Validation (parseEventRegistrationPayload)
  ├─ Validates name is not empty ✓
  ├─ Validates gmail ends with @gmail.com ✓
  ├─ Validates teamName is not empty ✓
  └─ Validates role is LEADER or MEMBER ✓
         ↓
Controller (registerEventController)
  ├─ Authenticate user via JWT ✓
  ├─ Verify gmail matches signed-in account ✓
  ├─ Create or fetch team (if LEADER, creates team) ✓
  └─ Upsert user membership with displayName, email, role ✓
         ↓
Database Document Creation
  ├─ Teams: teamId, name, status, createdByUserId, createdAt
  └─ Users: userId, teamId, displayName, email, role, isRegistered, timestamps
         ↓
Success Response
  └─ User + Team data returned to frontend
```

## Test Scenarios

### Scenario 1: LEADER Registration (Creates Team)
```json
{
  "name": "Rounak Mondal",
  "teamName": "FEYGDWHA",
  "role": "LEADER",
  "gmail": "rabinmondal04m@gmail.com"
}
```
**Expected:**
- Team "FEYGDWHA" created with status "active"
- User created with role "LEADER" and `isRegistered: true`
- User added to team

### Scenario 2: MEMBER Registration (Joins Existing Team)
```json
{
  "name": "Team Member",
  "teamName": "FEYGDWHA",
  "role": "MEMBER",
  "gmail": "member@gmail.com"
}
```
**Expected:**
- Finds existing team "FEYGDWHA"
- Creates user with role "MEMBER" in that team
- Fails if team doesn't exist

### Scenario 3: Validation - Invalid Gmail
```json
{
  "name": "Invalid User",
  "teamName": "Team",
  "role": "LEADER",
  "gmail": "notgmail@example.com"
}
```
**Expected Error:**
```
"Only Gmail accounts are allowed."
```

### Scenario 4: Validation - Missing Required Fields
```json
{
  "name": "",
  "teamName": "Team",
  "role": "LEADER",
  "gmail": "user@gmail.com"
}
```
**Expected Error:**
```
"`name`, `gmail`, `teamName`, `role` are required."
```

## Common Issues & Solutions

### Error: "Unknown attribute: teamId"
**Cause:** Collections not initialized with schema  
**Fix:** Run `npm run init:collections`

### Error: "Team not found"
**Cause:** User tried to join team, but it doesn't exist  
**Fix:** Team LEADER must register first to create team

### Error: "The provided Gmail must match the signed-in Google account"
**Cause:** User is signed in with different Gmail than registration form  
**Fix:** Ensure gmail in form matches Google sign-in account

### Error: "Please sign in with Google first"
**Cause:** User submitted form without JWT token  
**Fix:** Complete Google OAuth flow before registering

## Development Workflow

1. **First Time Setup:**
   ```bash
   npm install
   npm run init:collections
   npm run dev
   ```

2. **Testing Registration:**
   - Go to http://localhost:3000/register
   - Click "Continue with Google"
   - Complete Google OAuth
   - Fill in: Name, Team Name, Role, Gmail
   - Click "Register for Event"

3. **Verify Success:**
   - Check Appwrite console for created documents
   - User document created in Users collection
   - Team document created in Teams collection (if LEADER)

## Database Schema Reference

### Teams Collection
| Attribute       | Type   | Indexed | Purpose                  |
|-----------------|--------|---------|--------------------------|
| teamId          | string | -       | Unique team identifier   |
| name            | string | Yes     | Team name (for queries)  |
| status          | string | Yes     | "active" or "inactive"   |
| createdByUserId | string | -       | Creator user ID          |
| createdAt       | string | -       | Creation timestamp       |

### Users Collection
| Attribute   | Type    | Indexed | Purpose                          |
|-------------|---------|---------|----------------------------------|
| userId      | string  | -       | User ID from Appwrite            |
| teamId      | string  | -       | Team the user belongs to         |
| displayName | string  | -       | User's display name              |
| email       | string  | Yes     | User's email (for queries)       |
| role        | string  | -       | "LEADER" or "MEMBER"             |
| isRegistered| boolean | -       | Whether registered for event     |
| createdAt   | string  | -       | Account creation timestamp       |
| updatedAt   | string  | -       | Last update timestamp            |

## Troubleshooting Commands

```bash
# Check initialization script
node -r tsx scripts/initializeCollections.ts

# Check linting
npm run lint

# Rebuild
npm run build

# Restart dev server
npm run dev
```
