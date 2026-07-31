# DataBoard — Architecture

## System overview

```mermaid
flowchart LR
  subgraph Browser
    UI[React SPA]
    AX[Axios + JWT interceptor]
  end

  subgraph Server["Backend (FastAPI)"]
    API[API routers]
    AUTH[Auth deps + security]
    ORM[SQLAlchemy sessions]
  end

  subgraph Cloud
    PG[(Neon PostgreSQL)]
  end

  UI --> AX
  AX -->|HTTP JSON / multipart| API
  API --> AUTH
  API --> ORM
  ORM --> PG
```

---

## Screens ↔ features

```mermaid
flowchart TB
  L[Screen 0: Login / Register] --> H[Screen 1: Home]
  H --> D[Screen 2: Data]
  H --> P[Screen 3: Analytics]

  D --> U[Upload CSV]
  D --> Lst[List + pagination]
  D --> Pr[Preview 25 rows]
  D --> Del[Delete + confirm]

  P --> C[Compute min/max/sum]
  P --> Ch[ECharts scatter/line/bar]
```

---

## Backend layers

```mermaid
flowchart TB
  subgraph entry
    main[main.py lifespan + CORS]
  end

  subgraph api_layer[api/]
    auth_r[auth.py]
    ds_r[datasets.py]
    cmp_r[compute.py]
    deps[deps.py get_current_user]
  end

  subgraph core_layer[core/]
    cfg[config.py]
    db[database.py]
    sec[security.py]
  end

  subgraph data_layer
    models[models/]
    schemas[schemas/]
  end

  main --> auth_r
  main --> ds_r
  main --> cmp_r
  auth_r --> deps
  ds_r --> deps
  cmp_r --> deps
  deps --> sec
  deps --> db
  auth_r --> models
  ds_r --> models
  cmp_r --> models
  db --> cfg
  sec --> cfg
```

**Request path (protected):**

1. Router receives request  
2. `Depends(get_current_user)` → Bearer JWT → user row  
3. `Depends(get_db)` → SQLAlchemy session (closed after response)  
4. Handler runs business logic + commit  

---

## Auth sequence

```mermaid
sequenceDiagram
  participant U as User
  participant FE as React
  participant BE as FastAPI
  participant DB as Neon

  U->>FE: Register / Login
  FE->>BE: POST /auth/login
  BE->>DB: Verify argon2 hash
  BE-->>FE: access_token + Set-Cookie refresh_token
  FE->>FE: Store access_token in localStorage

  U->>FE: Call protected API
  FE->>BE: Authorization Bearer access
  BE-->>FE: 200 OK

  Note over FE,BE: Access expired
  FE->>BE: Request → 401
  FE->>BE: POST /auth/refresh (cookie)
  BE-->>FE: New access_token + rotated cookie
  FE->>BE: Retry original request

  U->>FE: Logout
  FE->>BE: POST /auth/logout
  BE-->>FE: Clear refresh cookie
```

---

## Upload & compute data flow

```mermaid
flowchart LR
  CSV[CSV file] --> UP[POST /dataset]
  UP --> PD[pandas parse]
  PD --> DS[datasets row]
  PD --> DR[data_rows JSON rows]
  DS --> PG[(Postgres)]
  DR --> PG

  PG --> CMP[POST .../compute]
  CMP --> VAL[Extract column → float]
  VAL --> OUT[min / max / sum or edge message]

  PG --> PLT[GET .../plot]
  PLT --> ARR[col1_values + col2_values]
  ARR --> EC[ECharts]
```

---

## Database schema

```mermaid
erDiagram
  users ||--o{ datasets : owns
  datasets ||--o{ data_rows : contains

  users {
    int id PK
    string email UK
    string hashed_password
    datetime created_at
  }

  datasets {
    int id PK
    int user_id FK
    string name
    string original_filename
    json column_names
    int row_count
    datetime created_at
  }

  data_rows {
    int id PK
    int dataset_id FK
    int row_index
    json data
  }
```

Design notes:

- Flexible CSV schemas via JSON row documents  
- Cached `column_names` / `row_count` avoid full scans for list UI  
- Deleting a dataset cascades to all `data_rows`

---

## Frontend structure

```mermaid
flowchart TB
  App[App.tsx AuthProvider + Routes]
  App --> Login[LoginPage]
  App --> Prot[ProtectedRoute]
  Prot --> Home[HomePage]
  Prot --> Data[DataPage]
  Prot --> Plot[PlotPage]
  Login --> Ctx[AuthContext]
  Prot --> Ctx
  Data --> API[api/datasets.ts]
  Plot --> API
  API --> Client[api/client.ts axios]
  Client --> BE[localhost:8000]
```

---

## Concurrency model (interview note)

This take-home uses **sync** FastAPI handlers + sync SQLAlchemy:

- Uvicorn still runs an ASGI server; sync routes run in a threadpool when needed  
- Connection pooling: `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`  
- CSV parsing is CPU-bound and runs in the request thread (acceptable for small sample CSVs)  

Async (`asyncpg`) was deferred as a stretch goal — see [assumptions.md](./assumptions.md).
