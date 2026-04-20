This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm ci
```

### 2. Configure Appwrite (Required)

Follow these steps to set up your Appwrite backend:

1. **Create an Appwrite account**: https://cloud.appwrite.io
2. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```
3. **Fill in your Appwrite credentials** in `.env` file:
   - `APPWRITE_ENDPOINT`
   - `APPWRITE_PROJECT_ID`
   - `APPWRITE_API_KEY`
   - `APPWRITE_DATABASE_ID`
   - `APPWRITE_TEAMS_COLLECTION_ID`
   - `APPWRITE_USERS_COLLECTION_ID`
   - `APPWRITE_PROJECTS_COLLECTION_ID`
   - `APPWRITE_VOTES_COLLECTION_ID`
   - `APPWRITE_STORAGE_BUCKET_ID`

4. **Initialize the database schema**:
   ```bash
   npm run init:collections
   ```
   
   You should see: ✅ Collections initialized successfully!

For detailed Appwrite setup, see [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run init:collections` - Initialize Appwrite collections
- `npm run fix:storage-access` - Backfill Appwrite storage bucket/file guest-read permissions
- `npm test` - Run tests (when available)

## 🏗️ Project Structure

- `app/` - Next.js App Router pages and API routes
- `backend/` - Backend logic (controllers, services, middleware)
- `features/` - Frontend feature components and hooks
- `components/` - Shared UI components
- `docs/` - Project documentation

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Appwrite Documentation](https://appwrite.io/docs) - learn about Appwrite backend

## 🤝 Contributing

See [docs/development.md](docs/development.md) for development guidelines.
