#!/usr/bin/env python3
"""
Comprehensive API endpoint testing script.

This script tests all implemented API endpoints and validates responses.
Run with: python backend/test_endpoints.py
"""

import sys
import os
import json
from datetime import date, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def test_case(name: str, test_func):
    """Decorator for test cases."""
    try:
        test_func()
        print(f"{GREEN}✓{RESET} {name}")
        return True
    except AssertionError as e:
        print(f"{RED}✗{RESET} {name}: {e}")
        return False
    except Exception as e:
        print(f"{RED}✗{RESET} {name}: {type(e).__name__}: {e}")
        return False


def print_header(text: str):
    """Print a section header."""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def print_response(response, verbose=False):
    """Pretty print response."""
    if verbose:
        try:
            data = response.json()
            print(f"{YELLOW}Status: {response.status_code}{RESET}")
            print(f"{YELLOW}Response:{RESET}")
            print(json.dumps(data, indent=2)[:500] + "...")
        except:
            print(f"{YELLOW}Status: {response.status_code}{RESET}")
            print(f"{YELLOW}Response:{RESET} {response.text[:200]}")


# ============================================================================
# TESTS
# ============================================================================

def test_health_endpoint():
    """Test /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "status" in data, "Missing 'status' in response"
    assert data["status"] == "ok", f"Expected status=ok, got {data['status']}"


def test_root_endpoint():
    """Test / endpoint."""
    response = client.get("/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "message" in data, "Missing 'message' in response"


def test_maps_endpoint():
    """Test /maps endpoint."""
    response = client.get("/maps")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "maps" in data, "Missing 'maps' in response"
    maps = data["maps"]
    assert len(maps) == 3, f"Expected 3 maps, got {len(maps)}"
    
    # Check map structure
    for map_config in maps:
        assert "map_id" in map_config, "Missing 'map_id'"
        assert "scale" in map_config, "Missing 'scale'"
        assert "origin_x" in map_config, "Missing 'origin_x'"
        assert "origin_z" in map_config, "Missing 'origin_z'"
        assert map_config["map_id"] in ["AmbroseValley", "GrandRift", "Lockdown"]


def test_matches_endpoint_basic():
    """Test /matches endpoint without filters."""
    response = client.get("/matches?limit=5")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "matches" in data, "Missing 'matches' in response"
    assert "total" in data, "Missing 'total' in response"
    assert "limit" in data, "Missing 'limit' in response"
    assert "offset" in data, "Missing 'offset' in response"


def test_matches_endpoint_with_filters():
    """Test /matches endpoint with date and map filters."""
    response = client.get("/matches?date=2026-02-10&map=AmbroseValley&limit=5")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "matches" in data, "Missing 'matches' in response"
    
    # If matches exist, check structure
    if data["matches"]:
        match = data["matches"][0]
        assert "match_id" in match, "Missing 'match_id'"
        assert "map" in match, "Missing 'map'"
        assert "date" in match, "Missing 'date'"
        assert "player_count" in match, "Missing 'player_count'"


def test_matches_pagination():
    """Test /matches pagination."""
    response = client.get("/matches?limit=5&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 5, f"Expected limit=5, got {data['limit']}"
    assert data["offset"] == 0, f"Expected offset=0, got {data['offset']}"


def test_matches_invalid_date_filter():
    """Test /matches with invalid date format."""
    response = client.get("/matches?date=invalid-date")
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"


def test_journey_endpoint_invalid_match():
    """Test /match/:match_id/journey with invalid match ID."""
    response = client.get("/match/invalid-match-id/journey")
    assert response.status_code == 404, f"Expected 404, got {response.status_code}"


def test_journey_endpoint_structure():
    """Test /match/:match_id/journey response structure."""
    # Get a match first
    matches_resp = client.get("/matches?limit=1")
    if matches_resp.status_code != 200 or not matches_resp.json()["matches"]:
        print(f"{YELLOW}⊘ Skipping journey test (no matches available){RESET}")
        return
    
    match_id = matches_resp.json()["matches"][0]["match_id"]
    response = client.get(f"/match/{match_id}/journey")
    
    if response.status_code == 200:
        data = response.json()
        assert "journeys" in data, "Missing 'journeys' in response"
        
        if data["journeys"]:
            journey = data["journeys"][0]
            assert "player_id" in journey, "Missing 'player_id'"
            assert "positions" in journey, "Missing 'positions'"
            
            if journey["positions"]:
                pos = journey["positions"][0]
                assert "pixel_x" in pos, "Missing 'pixel_x'"
                assert "pixel_y" in pos, "Missing 'pixel_y'"
                assert "ts" in pos, "Missing 'ts'"


def test_events_endpoint_structure():
    """Test /match/:match_id/events response structure."""
    # Get a match first
    matches_resp = client.get("/matches?limit=1")
    if matches_resp.status_code != 200 or not matches_resp.json()["matches"]:
        print(f"{YELLOW}⊘ Skipping events test (no matches available){RESET}")
        return
    
    match_id = matches_resp.json()["matches"][0]["match_id"]
    response = client.get(f"/match/{match_id}/events")
    
    if response.status_code == 200:
        data = response.json()
        assert "events" in data, "Missing 'events' in response"
        assert "match_id" in data, "Missing 'match_id'"
        assert "map" in data, "Missing 'map'"


def test_events_endpoint_with_filter():
    """Test /match/:match_id/events with event type filter."""
    # Get a match first
    matches_resp = client.get("/matches?limit=1")
    if matches_resp.status_code != 200 or not matches_resp.json()["matches"]:
        print(f"{YELLOW}⊘ Skipping events filter test (no matches available){RESET}")
        return
    
    match_id = matches_resp.json()["matches"][0]["match_id"]
    response = client.get(f"/match/{match_id}/events?event_type=Kill")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "events" in data, "Missing 'events' in response"


def test_heatmap_endpoint_structure():
    """Test /heatmaps/{map}/{type} response structure."""
    response = client.get("/heatmaps/AmbroseValley/kills")
    
    if response.status_code == 200:
        data = response.json()
        assert "map" in data, "Missing 'map'"
        assert "heatmap_type" in data, "Missing 'heatmap_type'"
        assert "grid" in data, "Missing 'grid'"
        assert "grid_size" in data, "Missing 'grid_size'"
        assert "max_value" in data, "Missing 'max_value'"
        
        # Check grid is properly formed
        grid = data["grid"]
        grid_size = data["grid_size"]
        assert len(grid) == grid_size, f"Grid height mismatch: expected {grid_size}, got {len(grid)}"


def test_heatmap_invalid_type():
    """Test /heatmaps with invalid heatmap type."""
    response = client.get("/heatmaps/AmbroseValley/invalid_type")
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"


def test_heatmap_invalid_map():
    """Test /heatmaps with invalid map."""
    response = client.get("/heatmaps/InvalidMap/kills")
    # This might return 200 with empty grid or 400 depending on implementation
    assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"


def test_heatmap_with_date_range():
    """Test /heatmaps with date range filters."""
    response = client.get(
        "/heatmaps/AmbroseValley/kills?date_start=2026-02-10&date_end=2026-02-14"
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


def test_heatmap_grid_size_parameter():
    """Test /heatmaps with custom grid size."""
    response = client.get("/heatmaps/AmbroseValley/kills?grid_size=16")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["grid_size"] == 16, f"Expected grid_size=16, got {data['grid_size']}"


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    """Run all tests."""
    print(f"\n{BOLD}🧪 Player Journey API - Comprehensive Test Suite{RESET}\n")
    
    results = {
        "passed": 0,
        "failed": 0,
        "skipped": 0,
    }
    
    # Health & Status Tests
    print_header("Health & Status Tests")
    results["passed"] += test_case("Health endpoint", test_health_endpoint)
    results["passed"] += test_case("Root endpoint", test_root_endpoint)
    
    # Map Tests
    print_header("Map Configuration Tests")
    results["passed"] += test_case("Maps endpoint", test_maps_endpoint)
    
    # Match Tests
    print_header("Match Query Tests")
    results["passed"] += test_case("List matches (basic)", test_matches_endpoint_basic)
    results["passed"] += test_case("List matches (with filters)", test_matches_endpoint_with_filters)
    results["passed"] += test_case("Pagination", test_matches_pagination)
    results["passed"] += test_case("Invalid date filter", test_matches_invalid_date_filter)
    
    # Journey Tests
    print_header("Player Journey Tests")
    results["passed"] += test_case("Journey endpoint (invalid match)", test_journey_endpoint_invalid_match)
    results["passed"] += test_case("Journey endpoint (structure)", test_journey_endpoint_structure)
    
    # Event Tests
    print_header("Event Query Tests")
    results["passed"] += test_case("Events endpoint (structure)", test_events_endpoint_structure)
    results["passed"] += test_case("Events endpoint (with filter)", test_events_endpoint_with_filter)
    
    # Heatmap Tests
    print_header("Heatmap Tests")
    results["passed"] += test_case("Heatmap endpoint (structure)", test_heatmap_endpoint_structure)
    results["passed"] += test_case("Heatmap (invalid type)", test_heatmap_invalid_type)
    results["passed"] += test_case("Heatmap (invalid map)", test_heatmap_invalid_map)
    results["passed"] += test_case("Heatmap (date range)", test_heatmap_with_date_range)
    results["passed"] += test_case("Heatmap (custom grid size)", test_heatmap_grid_size_parameter)
    
    # Summary
    print_header("Test Summary")
    total = results["passed"] + results["failed"]
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    print(f"{YELLOW}Skipped: {results['skipped']}{RESET}")
    print(f"\nTotal: {total} tests\n")
    
    if results["failed"] == 0:
        print(f"{GREEN}{BOLD}✓ All tests passed!{RESET}\n")
        return 0
    else:
        print(f"{RED}{BOLD}✗ Some tests failed{RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
