import pytest
from flask import Flask
from backend.app.__main__ import app as flask_app

@pytest.fixture
def client():
    with flask_app.test_client() as client:
        yield client

def test_gainers_route(client):
    response = client.get("/gainers")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    if data:
        assert "product" in data[0]
        assert "percent_change" in data[0]

def test_banner_route(client):
    response = client.get("/banner")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    if data:
        assert "product" in data[0]
        assert "percent_change" in data[0]
