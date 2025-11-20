Docker instructions for this project

Overview
- frontend: Vite React app built and served by nginx
- backend: Python service (`integrated_watcher.py`) exposing a WebSocket on port 9001 and tailing `app.log`
- log-generator: test logs generator writing to `app.log`

Quick start (requires Docker and Docker Compose)

1) Build and start the stack:

   docker compose up --build -d

2) Open the frontend in your browser:

   http://localhost:5173/

3) Stop the stack:

   docker compose down

Notes
- The backend and the log-generator share a Docker volume `app_logs` mounted at `/app` so `generate_test_logs.py` writes to `/app/app.log` and `integrated_watcher.py` tails `/app/app.log`.
- If you want to run the frontend in dev mode (vite) instead of the built production bundle, adjust the `frontend` service to run `npm run dev` and map port 5173 to the container's 5173.
- The backend image installs `xgboost` and related packages which may take some time to build.
