# DataBoard — Setup & Run Guide

Full-stack app: upload CSV datasets, preview/delete them, compute column stats, and plot charts with Apache ECharts.

**Spec files (do not edit):** `../ProjectSpec.md`, `../README.md` (assignment brief).

---

## Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI + sync SQLAlchemy + psycopg2 |
| Frontend | React + Vite + TypeScript |
| Database | Neon PostgreSQL (free tier) |
| Auth | argon2 passwords, JWT access + HttpOnly refresh cookie |
| Charts | Apache ECharts (`echarts-for-react`) |

See [assumptions.md](./assumptions.md) for the full list.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- Neon Postgres project (or any Postgres URL with SSL)

---

## 1. Environment

Copy the example env file:

```bash
# from repo root
copy .env.example backend\.env   # Windows
# cp .env.example backend/.env   # macOS/Linux
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
SECRET_KEY=change-me-to-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

`?sslmode=require` is required for Neon.

---

## 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

- Health: http://localhost:8000/health → `{"status":"ok"}`
- Swagger: http://localhost:8000/docs

Tables (`users`, `datasets`, `data_rows`) are created on startup via `Base.metadata.create_all()`.

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## 4. Manual test flow

1. Register / login on `/login`
2. Go to **Data** → upload `sample_data/retail_sales.csv` (or `electronics_sales.csv`)
3. Preview rows, paginate if you upload several datasets
4. Delete with confirmation
5. Go to **Plot** → pick dataset → compute min/max/sum → generate scatter/line/bar chart
6. Logout → refresh cookie cleared; protected routes redirect to login

---

## 5. Automated tests

```bash
cd backend
venv\Scripts\activate   # if not already
pytest tests/test_compute.py -v
```

Covers compute edge cases required by the spec:

- Empty column (no rows)
- All-nulls column
- Non-numeric column requested as numeric

Plus happy-path sum/min/max and missing column/dataset errors.

Tests use SQLite (`test.db`); Neon is not required for pytest.

---

## 6. JWT refresh / re-login strategy

Documented for the submission checklist — see also [architecture.md](./architecture.md).

| Token | Lifetime | Storage | Use |
|---|---|---|---|
| Access | 15 minutes | JSON body → `localStorage` | `Authorization: Bearer …` on API calls |
| Refresh | 7 days | HttpOnly cookie (`refresh_token`) | Silent renew via `POST /auth/refresh` |

**Flow**

1. Login returns `access_token` in body and sets HttpOnly `refresh_token` cookie.
2. Axios attaches the access token on each request.
3. On **401**, the client calls `POST /auth/refresh` (cookie sent automatically with `withCredentials`).
4. Refresh validates the cookie JWT (`type=refresh`), issues a **new access token**, and **rotates** the refresh cookie.
5. If refresh fails (missing/expired cookie), the client clears local storage and redirects to `/login`.
6. Logout deletes the refresh cookie (matching `httponly` / `samesite` flags).

**Security notes**

- Passwords hashed with **argon2** (never stored plain).
- Refresh token is not readable by JavaScript (HttpOnly).
- Refresh tokens are **not** stored in the database (cookie JWT only) — simpler take-home approach; reuse detection via token families is out of scope.
- `secure=False` locally (HTTP); set `secure=True` behind HTTPS in production.

---

## 7. Project layout

```
DataBoard/
├── ProjectSpec.md          # Assignment spec (untouched)
├── README.md               # Assignment brief (untouched)
├── docs/                   # This documentation
├── .env.example
├── sample_data/
├── backend/
│   ├── main.py
│   ├── core/               # config, database, security
│   ├── models/
│   ├── schemas/
│   ├── api/
│   └── tests/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── types/
```

---

## Related docs

- [Architecture](./architecture.md)
- [Assumptions](./assumptions.md)
- [API map](./api.md)
