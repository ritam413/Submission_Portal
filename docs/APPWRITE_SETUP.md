# Appwrite Collection Setup

This document explains how to initialize your Appwrite collections with the required attributes for the ShipOrShink application.

## Prerequisites

- Appwrite instance running and configured (https://cloud.appwrite.io)
- Environment variables set in `.env` file (see "Getting Started" section below)

## Getting Started

### Step 1: Create Appwrite Credentials

1. **Create an Appwrite Account**
   - Go to https://cloud.appwrite.io and sign up
   - Create a new project

2. **Get Your Credentials**
   - **APPWRITE_ENDPOINT**: Usually `https://cloud.appwrite.io/v1` for Appwrite Cloud
   - **APPWRITE_PROJECT_ID**: Found in Project Settings → API Keys section
   - **APPWRITE_API_KEY**: Create a new API key in Settings → API Keys with admin permissions

3. **Create a Database & Collections (optional)**
   - Create a database in your Appwrite console
   - Note the **APPWRITE_DATABASE_ID**
   - The initialization script will create the collections automatically

### Step 2: Configure .env File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then open `.env` and update:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=your_database_id_here
APPWRITE_TEAMS_COLLECTION_ID=your_teams_collection_id_here
APPWRITE_USERS_COLLECTION_ID=your_users_collection_id_here
APPWRITE_PROJECTS_COLLECTION_ID=your_projects_collection_id_here
APPWRITE_VOTES_COLLECTION_ID=your_votes_collection_id_here
APPWRITE_STORAGE_BUCKET_ID=your_storage_bucket_id_here
```

### Step 3: Run the Initialization Script

Execute the collection initialization:

```bash
npm run init:collections
```

This will:
1. Create all required attributes in the Teams collection:
   - `teamId` (string)
   - `name` (string, indexed)
   - `status` (string, indexed)
   - `createdByUserId` (string)
   - `createdAt` (string)

2. Create all required attributes in the Users collection:
   - `userId` (string)
   - `teamId` (string)
   - `displayName` (string)
   - `email` (string, indexed)
   - `role` (string)
   - `isRegistered` (boolean)
   - `createdAt` (string)
   - `updatedAt` (string)

3. Create all required attributes in the Projects collection:
   - `projectId`, `slug`, `teamId`, `ownerUserId`, `title`, `tagline`, `description`
   - `repoUrl`, `demoUrl`, `liveUrl`, `teamName`, `assetFileIds`
   - `submittedAt`, `status`, `totalVoteCount`, `validVoteCount`, `avgRating`
   - `radicalCount`, `vibrantCount`, `complexCount`, `deadlyCount`, `updatedAt`, `version`

4. Create all required attributes in the Votes collection:
   - `voteId`, `roundId`, `reviewerTeamId`, `projectId`, `userId`
   - `rating`, `liked`, `comment`, `clientEventId`, `createdAt`, `updatedAt`

5. Create indexes used by backend queries and uniqueness rules:
   - team name uniqueness
   - user lookup fields
   - project `slug` and team ownership
   - unique vote key (`userId`, `projectId`)

### Step 4: Verify

If the script completes successfully, you'll see:
```
✅ Collections initialized successfully! Your Appwrite database is ready.
```

## Collections Schema

### Teams Collection
| Attribute | Type | Indexed | Required |
|-----------|------|---------|----------|
| teamId | string | - | No |
| name | string | Yes (unique) | No |
| status | string | Yes | No |
| createdByUserId | string | - | No |
| createdAt | string | - | No |

### Users Collection
| Attribute | Type | Indexed | Required |
|-----------|------|---------|----------|
| userId | string | - | No |
| teamId | string | - | No |
| displayName | string | - | No |
| email | string | Yes | No |
| role | string | - | No |
| isRegistered | boolean | - | No |
| createdAt | string | - | No |
| updatedAt | string | - | No |

## Fallback Behavior

The application includes fallback logic for:
- **Missing indexes**: If attributes aren't indexed, queries fall back to client-side filtering
- **Collection queries**: The system will fetch all documents and filter in-memory if Server queries fail

This ensures the app continues working even if initialization is incomplete, though performance will be degraded.

## Troubleshooting

### Script fails with "Missing required environment variables"
1. Ensure all required environment variables are set in your `.env` file
2. Verify the `.env` file exists in the project root
3. Try: `cat .env` to confirm values are set

### "Unknown attribute" errors at runtime
Run: `npm run init:collections` to initialize the schema
The app will provide a helpful message directing you to run this command

### Attributes already exist error
This is normal and expected if running the script multiple times. Existing attributes are skipped.

### Permission denied errors
Ensure your `APPWRITE_API_KEY` has admin/write permissions on the database.

If gallery media fails for guests with errors like `missing scopes (["buckets.read"])`, run:

```bash
npm run fix:storage-access
```

This command adds public read permission to the configured storage bucket and backfills existing files so media URLs work for non-authenticated viewers.

## Integration with Development

To initialize collections automatically during development setup:

1. Add this to your `package.json` setup script if you have one
2. Or run manually before first-time app startup

After initialization, the backend services will automatically use the indexed fields for efficient queries.
