# DataBoard — Deployment

Optional live hosting for the take-home (not required by the assignment spec).

## Live demo

| Service | URL |
|---|---|
| **API** | https://databoard-f8r1.onrender.com |
| **API docs** | https://databoard-f8r1.onrender.com/docs |
| **App (Vercel)** | https://data-board-beta.vercel.app |

> **Why the first request feels slow:** Render’s **free tier** spins down the API after idle time. The next hit can take **~30–50 seconds** (“cold start”) while the instance wakes. After that, responses are normal until it sleeps again. This is a free-tier tradeoff, not an app bug.

---

## Architecture

```
Browser
  → Vercel (React / Vite static build)
    → Render (FastAPI / uvicorn)
      → Neon PostgreSQL
```

- Frontend and API are on **different origins** → refresh cookies use `Secure` + `SameSite=none`.
- Database stays on **Neon** (already hosted).

---

## Deploy flow (what we did)

### 1. Backend — Render

1. New **Web Service** from GitHub repo `letsbegincode/DataBoard`
2. **Root directory:** `backend`
3. **Build:** `pip install -r requirements.txt`
4. **Start:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Python:** `3.11.9` (via `backend/.python-version` and/or env `PYTHON_VERSION=3.11.9`)  
   — needed so `pandas` installs from wheels (Python 3.14 tried to compile pandas and failed)
6. Set env vars (below) → Deploy

### 2. Frontend — Vercel

1. Import same GitHub repo  
2. **Root directory:** `frontend`  
3. Framework: Vite · Build: `npm run build` · Output: `dist`  
4. Env: `VITE_API_URL=https://databoard-f8r1.onrender.com`  
5. Deploy  
6. SPA routes: `frontend/vercel.json` rewrites deep links (`/plot`, `/data`, …) to `index.html` so refresh does not 404

### 3. Wire CORS

On Render, set `FRONTEND_URL` to the **exact** Vercel URL (no trailing slash) → restart the service.

### 4. Smoke test

Register → upload CSV → preview → plot → confirm login still works after access token refresh.

---

## Environment variables

### Render (backend)

| Key | Example / notes |
|---|---|
| `DATABASE_URL` | Neon URL with `?sslmode=require` |
| `SECRET_KEY` | Long random secret |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `MAX_UPLOAD_BYTES` | optional; default `5242880` (5 MB) |
| `MAX_UPLOAD_ROWS` | optional; default `10000` |
| `MAX_UPLOAD_COLUMNS` | optional; default `50` |
| `AUTH_RATE_LIMIT_PER_MINUTE` | optional; default `20` |
| `PYTHON_VERSION` | `3.11.9` (recommended) |

> With a non-localhost `FRONTEND_URL`, OpenAPI `/docs` is disabled. Upload/compute caps and in-process auth rate limits apply. Access JWT remains in `localStorage` (documented tradeoff).

### Vercel (frontend)

| Key | Example / notes |
|---|---|
| `VITE_API_URL` | `https://databoard-f8r1.onrender.com` (no trailing slash) |

Local dev needs none of the Vercel vars; frontend defaults to `http://localhost:8000`.

---

## Why cross-origin cookies matter

| Token | Storage | Cross-origin |
|---|---|---|
| Access JWT | `localStorage` → `Authorization` header | Works across Vercel → Render |
| Refresh JWT | HttpOnly cookie | Needs `Secure` + `SameSite=None` when sites differ |

Without those cookie flags, login can work briefly, then silent refresh fails after ~15 minutes.

---

## Local vs production

| | Local | Production (this setup) |
|---|---|---|
| Frontend | `npm run dev` :5173 | Vercel |
| Backend | `uvicorn` :8000 | Render |
| `FRONTEND_URL` | `http://localhost:5173` | Vercel URL |
| Cookies | `COOKIE_SECURE=false`, `SAMESITE=lax` | `true` / `none` |
| API URL in FE | default localhost | `VITE_API_URL` |

---

## Related

- [README.md](./README.md) — local setup & JWT strategy  
- [architecture.md](./architecture.md) — system design  
- [assumptions.md](./assumptions.md) — product/tech choices  
