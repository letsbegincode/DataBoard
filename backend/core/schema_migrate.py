"""Idempotent schema patches when Alembic is not used."""

from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_user_name_column(engine: Engine) -> None:
    """Add users.name if missing (existing Neon/local DBs created before the column)."""
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR"))
            return

        if dialect == "sqlite":
            rows = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            cols = {row[1] for row in rows}
            if "name" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
