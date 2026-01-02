# Folder Server

Express + TypeScript server that indexes a local filesystem folder and keeps a Postgres connection alive so you can verify the database is reachable before streaming files.

## Environment configuration

Create a `.env` file (or rename `.env.example`) with these variables:

```env
PORT=4000
INDEX_FOLDER=uploads
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
```

- `INDEX_FOLDER` is a path relative to the project root and is the directory that will be inspected and served at `/served`.
- `PORT` is the port the Express server listens on.
- The `DB_*` variables configure the Postgres connection pool.

## Scripts

- `npm run dev` launches the server with `ts-node-dev` and restarts on TypeScript changes.
- `npm run build` compiles the TypeScript into `dist/`.
- `npm start` runs the compiled build.

## Endpoints

- `GET /` returns the resolved configuration.
- `GET /api/status` checks Postgres connectivity.
- `GET /api/files` returns a recursive tree of the indexed folder.
- `GET /api/files/raw/<path>` streams raw files under the indexed root.
- `GET /served/<path>` serves static assets using `express.static`.

## Docker Compose

Run `docker compose up` (example below) to start Postgres with data persisted in a named volume.

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    env_file: .env
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata: ~
```

## Building a container for the folder server

Use the provided `Dockerfile` to containerize the project. The container installs dependencies, builds the TypeScript sources, and runs the compiled output.

```bash
docker build -t folder-server .
docker run --rm -p 4000:4000 --env-file .env folder-server
```
