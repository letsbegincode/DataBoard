"""Registration name, password bounds, and upload size guards."""

import io

from core.config import settings
from core.rate_limit import reset_rate_limits


def setup_function():
    reset_rate_limits()


def test_register_with_name_and_me(client):
    res = client.post(
        "/auth/register",
        json={"name": "Abhinav", "email": "abhinav@example.com", "password": "password123"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Abhinav"
    assert body["email"] == "abhinav@example.com"

    login = client.post(
        "/auth/login",
        json={"email": "abhinav@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"] == "Abhinav"


def test_register_duplicate_email_generic_message(client):
    payload = {"name": "A", "email": "dup@example.com", "password": "password123"}
    assert client.post("/auth/register", json=payload).status_code == 201
    again = client.post("/auth/register", json={**payload, "name": "B"})
    assert again.status_code == 409
    assert "could not register" in again.json()["detail"].lower()
    assert "already" not in again.json()["detail"].lower()


def test_register_requires_name(client):
    res = client.post(
        "/auth/register",
        json={"email": "noname@example.com", "password": "password123"},
    )
    assert res.status_code == 422


def test_password_too_long_rejected(client):
    res = client.post(
        "/auth/register",
        json={
            "name": "Long Pass",
            "email": "long@example.com",
            "password": "x" * 129,
        },
    )
    assert res.status_code == 422


def test_login_password_too_long_rejected(client):
    client.post(
        "/auth/register",
        json={"name": "OK", "email": "ok@example.com", "password": "password123"},
    )
    res = client.post(
        "/auth/login",
        json={"email": "ok@example.com", "password": "x" * 129},
    )
    assert res.status_code == 422


def test_upload_rejects_oversized_bytes(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_BYTES", 64)
    # More than 64 bytes of CSV content
    csv_content = "a,b\n" + ("1,2\n" * 40)
    files = {"file": ("big.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"name": "Too Big"}
    res = client.post("/dataset", files=files, data=data, headers=auth_headers)
    assert res.status_code == 413
    assert "too large" in res.json()["detail"].lower()


def test_upload_rejects_too_many_rows(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_ROWS", 3)
    csv_content = "a,b\n1,2\n3,4\n5,6\n7,8\n"
    files = {"file": ("rows.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"name": "Too Many Rows"}
    res = client.post("/dataset", files=files, data=data, headers=auth_headers)
    assert res.status_code == 400
    assert "too many rows" in res.json()["detail"].lower()


def test_upload_invalid_csv_generic_message(client, auth_headers):
    # Unclosed quote typically makes pandas raise a parse error
    files = {"file": ("bad.csv", io.BytesIO(b'"unclosed,quote\n1,2\n'), "text/csv")}
    data = {"name": "Bad CSV"}
    res = client.post("/dataset", files=files, data=data, headers=auth_headers)
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert detail == "Invalid CSV file"
    assert "ParserError" not in detail
    assert "Tokenizing" not in detail
