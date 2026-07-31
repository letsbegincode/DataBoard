import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.database import Base, get_db
from models.user import User
from models.dataset import Dataset, DataRow
from main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Register + login a test user, return auth headers."""
    client.post("/auth/register", json={"email": "test@test.com", "password": "password123"})
    response = client.post("/auth/login", json={"email": "test@test.com", "password": "password123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_dataset_with_numeric(client, auth_headers):
    """Upload a dataset with numeric column 'price' and text column 'name'."""
    import io
    csv_content = "name,price,quantity\nApple,1.5,10\nBanana,2.0,20\nCherry,3.5,30\n"
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"name": "Test Numeric Dataset"}
    response = client.post("/dataset", files=files, data=data, headers=auth_headers)
    return response.json()

@pytest.fixture
def test_dataset_all_nulls(client, auth_headers):
    """Upload a dataset where 'value' column is all nulls."""
    import io
    csv_content = "label,value\nA,\nB,\nC,\n"
    files = {"file": ("nulls.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"name": "All Nulls Dataset"}
    response = client.post("/dataset", files=files, data=data, headers=auth_headers)
    return response.json()

@pytest.fixture
def test_dataset_empty_column(auth_headers, setup_db):
    """
    EDGE CASE: Dataset with a column that has zero usable values.
    We seed directly in the DB to bypass upload validation.
    """
    db = TestSession()
    user = db.query(User).filter(User.email == "test@test.com").first()
    assert user is not None
    dataset = Dataset(
        user_id=user.id,
        name="Empty Column Dataset",
        original_filename="empty_col.csv",
        column_names=["label", "empty_col"],
        row_count=0,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    result = {"id": dataset.id, "column_names": dataset.column_names}
    db.close()
    return result
