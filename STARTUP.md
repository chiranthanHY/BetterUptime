---
description: How to start the BetterUptime project development environment
---

To start the project from scratch, follow these steps:

### 1. Start Infrastructure (Docker)
Ensure Docker Desktop is running, then start the Database and Redis:
```powershell
docker-compose up -d
```

### 2. Prepare the Database (If first time or schema changed)
Generate the Prisma client and sync the database tables:
```powershell
# In packages/store
cd packages/store
bun install
npx prisma generate
npx prisma db push
```

### 3. Start All Services
You can start all services (Frontend, API, Worker, Pusher) at once using Turbo from the root directory:
```powershell
# From the root directory
bun run dev
```

### Individual Service Commands (Alternative)
If you want to run specific parts of the app:
- **API**: `cd apps/api && bun run dev`
- **Frontend**: `cd apps/web && bun run dev`
- **Worker**: `cd apps/worker && bun run dev`
- **Pusher**: `cd apps/pusher && bun run dev`

### Accessing the App
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
