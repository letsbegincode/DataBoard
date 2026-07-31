# DataBoard — Technical Assumptions

Assumptions fill gaps where [`assignment/ProjectSpec.md`](./assignment/ProjectSpec.md) is silent or allows choice. These are intentional product/engineering decisions.

---

## Stack & runtime

| Topic | Assumption |
|---|---|
| Backend framework | **FastAPI** (Python) |
| ORM | **SQLAlchemy 2.0 sync** + **psycopg2** (async is a stretch goal, not used) |
| Frontend | **React + Vite + TypeScript** |
| Database | **Neon PostgreSQL** free tier; connection string includes `?sslmode=require` |
| Local run | **No Docker** — `uvicorn` + `npm run dev` only |
| Migrations | **No Alembic** — `Base.metadata.create_all()` on app startup |
| Deployment | **Not required** for submission; local run is enough |

---

## API & product behavior

| Topic | Assumption |
|---|---|
| Path style | Singular **`/dataset`** (matches spec), plus `/auth/*` |
| Auth extras | Spec lists register/login; we also implement **refresh**, **logout**, and **`GET /auth/me`** |
| Register response | Spec says “returns JWT”; we return `{ id, email, message }` then **auto-login** on the client |
| Preview | First **25** rows + column names |
| Plot | First **30** values for `col1` & `col2` via `GET /dataset/:id/plot` |
| Compute body | `{ "column": string, "operation": "min" \| "max" \| "sum" }` |
| Ownership | Datasets are **per authenticated user**; cross-user access → 404 |
| Pagination | Genuine `?page` & `?limit` with `total`, `pages`, `has_next`, `has_prev` |
| Upload | **CSV only**; empty CSV rejected; NaNs stored as JSON `null` |
| Screen 2 | Data management only (upload, list, preview, delete) |
| Screen 3 | **Both** compute statistics **and** ECharts plots |

---

## Data storage

| Topic | Assumption |
|---|---|
| Row storage | Each CSV row → `data_rows.data` as **JSON** (`{col: value}`) |
| Metadata | `datasets.column_names` + `row_count` cached on upload |
| Delete | ORM cascade + FK `ON DELETE CASCADE` removes rows with dataset |

---

## Auth & security

| Topic | Assumption |
|---|---|
| Password hash | **argon2** (spec allows bcrypt/argon2) |
| Access token | JWT, **15 min**, stored in `localStorage`, sent as Bearer |
| Refresh token | JWT, **7 days**, **HttpOnly** cookie only (not in DB) |
| Refresh rotation | New refresh cookie issued on each successful `/auth/refresh` |
| CSRF | SameSite=`lax` cookie; dedicated CSRF token not implemented |
| CORS | Allow `FRONTEND_URL` with credentials |

---

## Frontend

| Topic | Assumption |
|---|---|
| CSS | Plain CSS / existing Vite styles for now (polish optional) |
| Server state | Axios + React state (no React Query / Zustand required) |
| Charts | `echarts-for-react` — scatter, line, bar |
| Protected routes | Unauthenticated users redirected to `/login` |

---

## Testing

| Topic | Assumption |
|---|---|
| Required suite | pytest + FastAPI `TestClient` for **compute** edge cases |
| Test DB | **SQLite** file `test.db` (gitignored), not Neon |
| Scope | Spec-required edges + happy path + missing column/dataset |

---

## Out of scope (intentional)

- Cloud hosting / CI deploy
- Redis / Celery / background workers
- GraphQL
- Refresh-token family tracking / reuse detection in DB
- Async SQLAlchemy / asyncpg
- Rate limiting
- Email verification
