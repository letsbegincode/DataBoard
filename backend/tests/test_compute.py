"""
Tests for the compute endpoint edge cases.
Required by spec: empty column, all-nulls, non-numeric.
"""

def test_compute_sum_numeric_column(client, auth_headers, test_dataset_with_numeric):
    dataset_id = test_dataset_with_numeric["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "price", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["value"] == 7.0

def test_compute_min_numeric_column(client, auth_headers, test_dataset_with_numeric):
    dataset_id = test_dataset_with_numeric["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "price", "operation": "min"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["value"] == 1.5

def test_compute_max_numeric_column(client, auth_headers, test_dataset_with_numeric):
    dataset_id = test_dataset_with_numeric["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "quantity", "operation": "max"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["value"] == 30.0

def test_compute_empty_column(client, auth_headers, test_dataset_empty_column):
    dataset_id = test_dataset_empty_column["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "empty_col", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["value"] is None
    assert "empty" in data["message"].lower()

def test_compute_all_nulls_column(client, auth_headers, test_dataset_all_nulls):
    dataset_id = test_dataset_all_nulls["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "value", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["value"] is None
    assert "null" in data["message"].lower()

def test_compute_non_numeric_column(client, auth_headers, test_dataset_with_numeric):
    dataset_id = test_dataset_with_numeric["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "name", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert "non-numeric" in response.json()["detail"].lower()

def test_compute_nonexistent_column(client, auth_headers, test_dataset_with_numeric):
    dataset_id = test_dataset_with_numeric["id"]
    response = client.post(
        f"/dataset/{dataset_id}/compute",
        json={"column": "nonexistent", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()

def test_compute_nonexistent_dataset(client, auth_headers):
    response = client.post(
        "/dataset/99999/compute",
        json={"column": "any", "operation": "sum"},
        headers=auth_headers,
    )
    assert response.status_code == 404
