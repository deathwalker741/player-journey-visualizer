"""
Test script to verify all API endpoints are working correctly.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    print("✓ Health check passed")


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    print("✓ Root endpoint passed")


def test_maps():
    """Test maps endpoint."""
    response = client.get("/maps")
    print(f"  Maps endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('maps', []))} maps")
    else:
        print(f"  Error: {response.json()}")


def test_matches():
    """Test matches endpoint."""
    response = client.get("/matches?limit=5")
    print(f"  Matches endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {data.get('total', 0)} total matches")
    else:
        print(f"  Error: {response.json()}")


if __name__ == "__main__":
    print("🧪 Testing Player Journey API...\n")

    try:
        test_health()
        test_root()
        print("\n📊 Testing data endpoints...")
        test_maps()
        test_matches()
        print("\n✅ All basic tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
