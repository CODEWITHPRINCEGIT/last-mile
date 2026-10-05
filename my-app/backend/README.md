# Last-Mile Study Engine backend

This is a beginner-friendly FastAPI backend for the existing Next.js study workspace. It owns authentication verification, PostgreSQL records, PDF ingestion, user-isolated retrieval, and Gemini-powered study answers. It is a modular monolith: each external service is behind a small module so it can later be replaced without changing the API routes.

## Folder structure

```text
backend/
├── app/
│   ├── api/routes/       # HTTP endpoints
│   ├── core/             # settings, Firebase verification, logging
│   ├── db/               # SQLAlchemy base, database, and models
│   ├── rag/              # PDF extraction, chunking, embeddings, Chroma, prompts
│   ├── schemas/          # Pydantic request/response models
│   ├── services/         # database, storage, ingestion, and chat services
│   └── main.py           # FastAPI application
├── alembic/              # database migration environment and versions
├── tests/                # credential-free API tests
├── uploads/              # local PDFs; ignored by Git
├── vector_store/         # local Chroma data; ignored by Git
├── .env.example
├── alembic.ini
└── requirements.txt
```

## Install on Windows

Open PowerShell in this `backend` directory:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and replace the placeholders. The real `.env` is ignored by Git.

## Environment variables

Required for the complete application:

- `DATABASE_URL`: PostgreSQL URL such as `postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE`.
- `FRONTEND_URL`: allowed browser origin, normally `http://localhost:3000` in development. Multiple origins can be comma-separated.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`: Firebase Admin service-account values. Keep the private key out of source control; `\n` sequences are converted to newlines at runtime.
- `GEMINI_API_KEY`: server-only Google Gemini API key.

Optional tuning values are shown in `.env.example`: model names, upload size, chunk size/overlap, Chroma directory, upload directory, and retrieval count. The defaults use `gemini-2.5-flash` and `gemini-embedding-001`; both can be changed without code edits.

## Firebase setup

1. Create or select a Firebase project.
2. Enable the sign-in providers you want, such as Email/Password and Google.
3. Add a Firebase Web App and copy its client configuration into the frontend `.env.local` using `my-app/.env.example` as the template.
4. In Firebase Project Settings, create a service account key or use an equivalent secret-management system.
5. Put the service account project ID, client email, and private key into the backend `.env` values. Do not commit a JSON key file or private key.

The browser signs users in and sends a Firebase ID token as `Authorization: Bearer <token>`. FastAPI verifies that token with Firebase Admin, then creates or updates the matching local PostgreSQL `users` row.

## PostgreSQL and migrations

Create an empty PostgreSQL database, then set `DATABASE_URL`. From this directory:

```powershell
alembic upgrade head
```

Useful migration commands:

```powershell
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
alembic downgrade -1
```

Migrations are explicit and do not automatically destroy or recreate a database.

## Gemini setup

Create a Gemini API key in the Google AI developer console and set `GEMINI_API_KEY` only in the backend `.env`. The key is used by the embedding service and answer-generation service and is never returned to the browser.

## Run the API

After installing dependencies and applying migrations:

```powershell
uvicorn app.main:app --reload
```

The command should be run from `backend/`. Open:

- API welcome: http://localhost:8000/
- Health: http://localhost:8000/health
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## How document ingestion works

`POST /documents/upload` accepts an authenticated `multipart/form-data` PDF and a document type. The file receives a generated safe filename and is saved under `uploads/`. A database row is created, then a FastAPI background task:

1. marks it `processing`;
2. extracts page text with PyMuPDF;
3. splits page text with `RecursiveCharacterTextSplitter`;
4. generates Gemini embeddings;
5. stores text, embeddings, and source metadata in ChromaDB;
6. marks the row `ready`, or `failed` with a safe error message.

The first implementation uses `BackgroundTasks` so it stays easy to understand. A worker can replace this service boundary later.

## How RAG chat works

`POST /chat` verifies session ownership, saves the learner message, embeds the question, queries ChromaDB with a mandatory `user_id` filter, builds a source-labelled context, adds a bounded recent window from the same session, applies one of the four study-mode prompts, calls Gemini, saves the assistant message, and returns the answer plus document/page sources. The model is instructed to say when the uploaded context is insufficient rather than inventing a document-based answer.

## API endpoints

Public:

- `GET /` — API welcome message.
- `GET /health` — liveness check.

Authenticated:

- `GET /users/me` — create/update and return the local user.
- `POST /documents/upload` — upload a PDF.
- `GET /documents` — list only the current user's documents.
- `GET /documents/{document_id}` — get one owned document.
- `DELETE /documents/{document_id}` — delete the owned document, file, and vectors.
- `POST /sessions` — create a study session.
- `GET /sessions` — list owned sessions.
- `GET /sessions/{session_id}` — get one owned session.
- `GET /sessions/{session_id}/messages` — get chronologically ordered messages for one owned study session.
- `DELETE /sessions/{session_id}` — delete an owned session and its messages.
- `POST /chat` — retrieve owned chunks and generate/save a study answer.

Valid modes are `panic`, `exam_answers`, `reverse_revision`, and `deep_architecture`. Valid document types are `syllabus`, `lecture_notes`, `lecture_slides`, `pyq`, and `other`.

## Frontend connection

The existing frontend uses `my-app/lib/api.ts`. It reads `NEXT_PUBLIC_API_URL`, gets the current Firebase user's ID token, and sends it as a bearer header. `AccountWorkspace` now uses the existing account form to sign up, sign in, or continue with Google. `LaunchWorkspace` uses its existing prompt, mode selector, sidebar, and add-context control to create sessions, upload PDFs, list user documents, and display grounded answers.

## Tests

Tests use an isolated in-memory SQLite database and override Firebase verification. They do not require PostgreSQL, Chroma, Gemini, or production credentials.

```powershell
pytest
```

The test suite covers public health routes, missing/invalid authentication, PDF validation, session ownership, and chat request validation.
