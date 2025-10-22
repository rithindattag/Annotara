# AI Annotation Dashboard

Production-ready boilerplate for a Human-in-the-Loop (HITL) annotation workflow inspired by Centific tooling. The project contains a React + TypeScript client, Node.js/Express API, MongoDB database, AWS S3 integration for media storage, and Socket.IO for real-time task updates.

## Features

- 🔐 **Role-based authentication** — JWT stored in HTTP-only cookies with Annotator, Reviewer, and Admin roles.
- 🗂️ **Task management** — Upload images or videos to Amazon S3, automatically log metadata in MongoDB, and track task statuses.
- 🖍️ **Annotation workspace** — Konva-based canvas for drawing bounding boxes with AI-assisted pre-annotations powered by a mock Bedrock response or optional AWS Rekognition integration.
- 📡 **Real-time collaboration** — Task locking and live status broadcasts powered by Socket.IO.
- 🛠️ **Admin tools** — Assign work, monitor progress, and export annotations as JSON snapshots.
- ✅ **Reviewer workflow** — Dedicated queue where reviewers approve or request changes with contextual notes.
- ☁️ **Cloud-ready** — AWS SDK v3 integration for S3 uploads, Docker and docker-compose for local development, ESLint + Prettier for consistent code quality.

## Tech Stack

| Layer      | Technologies |
|------------|--------------|
| Frontend   | React 18, TypeScript, Vite, Redux Toolkit, React Router, Konva |
| Backend    | Node.js 20, Express, Mongoose, Socket.IO |
| Database   | MongoDB |
| Storage    | AWS S3 (mock credentials for local development) |
| Auth       | JWT (HTTP-only cookies) |
| Containers | Docker, docker-compose |

## Architecture Overview

```
/ai-annotation-dashboard
├── client               # React + Vite front-end
│   ├── src
│   │   ├── pages        # Dashboard, Admin, Annotation workspace, Auth
│   │   ├── store        # Redux Toolkit slices for auth + tasks
│   │   ├── hooks        # Typed Redux hooks
│   │   └── utils        # Axios instance
├── server               # Express REST API
│   ├── src
│   │   ├── config       # Environment + database setup
│   │   ├── controllers  # Route handlers
│   │   ├── middleware   # JWT guards, error handler
│   │   ├── models       # Mongoose schemas
│   │   ├── routes       # Route groupings (/auth, /tasks, ...)
│   │   └── services     # S3 + WebSocket helpers
├── docker-compose.yml   # Local orchestration (Mongo, API, Client)
└── README.md
```

## Getting Started

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + docker-compose plugin
- Optional: Node.js 20+ if you prefer running outside Docker

### 2. Environment Variables

Copy the `.env.example` file and adjust secrets as needed:

```bash
cp .env.example .env
```

The defaults target the docker-compose network. If you run the backend directly on your host, update `MONGO_URI` to `mongodb://localhost:27017/annotation-dashboard` and `CLIENT_URL` to match your dev server (usually `http://localhost:5173`).

### 3. Verify Docker setup (optional but recommended)

Use the helper script to confirm the Docker daemon and Compose plugin are available before launching the stack:

```bash
./scripts/check-docker.sh
```

### 4. Start the stack

```bash
docker compose up --build
```

Services started:

- **Client** → http://localhost:5173
- **API** → http://localhost:5000 (health check at `/health`)
- **MongoDB** → localhost:27017 with a persistent Docker volume

Hot reloading is enabled via bind mounts for both the client and server containers.

### 5. Running locally without Docker (optional)

```bash
# Terminal 1 - MongoDB (if you have it installed locally)
mongod --dbpath=/path/to/mongo/data

# Terminal 2 - API
cd server
npm install
npm run dev

# Terminal 3 - Client
cd client
npm install
npm run dev
```

Remember to export the variables from `.env` or use a tool such as `direnv` when running services outside of Docker.

### 6. Configure AI providers

The `/api/ai/predict` endpoint supports two modes:

| Provider     | Description | How to enable |
|--------------|-------------|---------------|
| `mock` *(default)* | Generates deterministic sample boxes for demos and tests. | Set `AI_PROVIDER=mock` (default).
| `rekognition` | Calls `DetectLabels` on AWS Rekognition and converts bounding boxes into canvas coordinates. | Provide valid `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, ensure the media file exists in the configured S3 bucket, and set `AI_PROVIDER=rekognition`.

Optional knobs:

- `AI_REKOGNITION_MIN_CONFIDENCE` — Minimum confidence score (0-100) returned by Rekognition. Defaults to `60`.

When Rekognition is active, the dashboard records the last provider, timestamp, and detected labels for each task so reviewers can audit AI assistance.

## Key Workflows

### Authentication

- Register (`POST /api/auth/register`) to create Annotator/Reviewer/Admin accounts.
- Login (`POST /api/auth/login`) sets an HTTP-only JWT cookie; the client fetches the active session via `GET /api/auth/me`.

### Task Lifecycle

1. **Upload media** from the dashboard. Files are streamed to S3 and a new task document is created in MongoDB with metadata.
2. **Assign** tasks from the Admin panel or let annotators pull from the unassigned queue.
3. **Lock** a task via `/api/tasks/:taskId/lock` to prevent collisions.
4. **Annotate** in the Konva workspace, optionally pre-filling bounding boxes from `/api/ai/predict` (mock or Rekognition-backed).
5. **Save** annotations to MongoDB; the task status transitions to `awaiting_review` and WebSocket clients receive a live update.
6. **Review** the work from the reviewer dashboard. Submit `POST /api/annotations/:taskId/review` with a decision of `approved` or `rejected` plus optional notes that route back to the annotator.

### Export

Admins can download a JSON payload combining tasks and annotations via `GET /api/admin/export`. This is a convenient seed for building CSV/Parquet exporters later.

### Review Workflow

- Reviewers automatically see tasks with status `awaiting_review` on their dashboard.
- Use the annotation workspace to inspect the saved labels before approving or requesting changes.
- When a task is rejected, the annotator sees the review notes banner the next time they open the task.

## Testing & Linting

```bash
# Client linting
cd client
npm run lint

# Server linting
cd server
npm run lint
```

## Future Enhancements

- Deployment scripts for AWS ECS or serverless platforms

## License

This project is distributed for educational and internal prototype purposes. Adapt as needed for production use.
