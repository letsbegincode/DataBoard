# DataBoard — Project Documentation

> Assignment files `README.md` and `ProjectSpec.md` at the repo root are **not modified**.  
> This `docs/` folder is the project documentation for setup, architecture, and assumptions.

## Contents

| File | Purpose |
|---|---|
| [README.md](./README.md) | Setup, run, test steps, JWT refresh notes |
| [architecture.md](./architecture.md) | System design, layers, DB schema, Mermaid diagrams |
| [assumptions.md](./assumptions.md) | Technical assumptions where the spec is silent |
| [api.md](./api.md) | API endpoint map |

## Quick start

1. Configure `backend/.env` from root `.env.example` (Neon URL with `?sslmode=require`).
2. Backend: `cd backend` → create venv → `pip install -r requirements.txt` → `uvicorn main:app --reload`
3. Frontend: `cd frontend` → `npm install` → `npm run dev`
4. Open http://localhost:5173 — API docs at http://localhost:8000/docs

Sample CSVs: `sample_data/retail_sales.csv`, `sample_data/electronics_sales.csv`
