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
| Migrations | **No Alembic** — `Base.metadata.create_all()` on startup + idempotent `ALTER` for additive columns (e.g. `users.name`) |
| Deployment | **Not required** for submission; local run is enough |

---

## API & product behavior

| Topic | Assumption |
|---|---|
| Path style | Singular **`/dataset`** (matches spec), plus `/auth/*` |
| Auth extras | Spec lists register/login; we also implement **refresh**, **logout**, and **`GET /auth/me`** |
| Register body | Spec lists email/password; we also require **`name`** (1–50 chars) for greetings |
| Register / login email | Validated with Pydantic **`EmailStr`** (normalized lower/strip); not mailbox verification |
| Password length | **6–128** characters (min keeps take-home simple; max avoids Argon2 CPU DoS) |
| Register response | Spec says “returns JWT”; we return `{ id, email, name, message }` then **auto-login** on the client |
| Upload limits | Max **5 MB**, **10_000** rows, **50** columns (env-overridable) |
| Compute guard | Reject / limit at `MAX_UPLOAD_ROWS`; does not load unbounded row sets |
| Dataset names | **Unique per user** (409 on duplicate); list UI shows the user-given name (filename kept in DB only) |
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
| Access token | JWT, **15 min**, stored in `localStorage`, sent as Bearer (XSS tradeoff; HttpOnly access token is a stretch) |
| Refresh token | JWT, **7 days**, **HttpOnly** cookie only (not in DB; logout clears cookie client-side — server revoke is stretch) |
| Refresh rotation | New refresh cookie issued on each successful `/auth/refresh` |
| Auth rate limit | In-process sliding window per IP on `/register`, `/login`, `/refresh` (single worker) |
| CSRF | SameSite=`lax` locally; production may use `none` for cross-origin refresh — dedicated CSRF token not implemented |
| CORS | Allow `FRONTEND_URL` with credentials |
| API docs | `/docs` enabled only when `FRONTEND_URL` looks local |

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
- Access JWT in HttpOnly cookie (needs BFF / CSRF design)
- Async SQLAlchemy / asyncpg
- Email verification
- SQL-side aggregates for compute (stretch)
