# DataBoard — API Map

Base URL (local): `http://localhost:8000`  
Auth: Bearer access token unless noted. Refresh uses cookie.

---

## Authentication

| Method | Path | Auth | Body / notes | Response |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{ email, password }` (min 6 chars) | `201` `{ id, email, message }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ access_token, token_type }` + `refresh_token` cookie |
| POST | `/auth/refresh` | Cookie | (none) | New `access_token` + rotated cookie |
| POST | `/auth/logout` | Cookie | (none) | Clears refresh cookie |
| GET | `/auth/me` | Bearer | — | `{ id, email }` |

---

## Datasets

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/dataset` | Bearer | `multipart/form-data`: `file` (CSV) + `name` |
| GET | `/dataset` | Bearer | Query: `page`, `limit` — paginated list for current user |
| GET | `/dataset/{id}` | Bearer | Metadata for one dataset |
| GET | `/dataset/{id}/preview` | Bearer | First 25 rows + column names |
| DELETE | `/dataset/{id}` | Bearer | Deletes dataset + cascaded rows |
| POST | `/dataset/{id}/compute` | Bearer | Body: `{ column, operation: min\|max\|sum }` |
| GET | `/dataset/{id}/plot` | Bearer | Query: `col1`, `col2` — first 30 values each |

---

## Compute edge behavior

| Case | HTTP | Behavior |
|---|---|---|
| Empty column (no rows) | 200 | `value: null` + message |
| All nulls | 200 | `value: null` + message |
| Non-numeric values | 422 | Error detail |
| Unknown column | 400 | Error detail |
| Unknown / other user’s dataset | 404 | Not found |

---

## Pagination response shape

`GET /dataset?page=1&limit=10`

```json
{
  "items": [ /* DatasetResponse */ ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "pages": 3,
  "has_next": true,
  "has_prev": false
}
```

---

## Ops

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness `{ "status": "ok" }` |
| GET | `/docs` | OpenAPI Swagger UI |
