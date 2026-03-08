/**
 * API service client for Player Journey Visualization Tool
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Types
export interface MapConfig {
  map_id: string;
  scale: number;
  origin_x: number;
  origin_z: number;
  minimap_width: number;
  minimap_height: number;
  minimap_url: string;
}

export interface MapsResponse {
  maps: MapConfig[];
}

export interface MatchSummary {
  match_id: string;
  map: string;
  date: string;
  player_count: number;
  human_count: number;
  bot_count: number;
  duration_ms: number;
}

export interface MatchListResponse {
  matches: MatchSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface Position {
  pixel_x: number;
  pixel_y: number;
  ts: number;
}

export interface PlayerJourney {
  match_id: string;
  player_id: string;
  map: string;
  is_bot: boolean;
  positions: Position[];
  start_ts: number;
  end_ts: number;
}

export interface JourneyResponse {
  journeys: PlayerJourney[];
}

export interface Event {
  event_type:
    | "Kill"
    | "Killed"
    | "BotKill"
    | "BotKilled"
    | "Loot"
    | "KilledByStorm"
    | "Position"
    | "BotPosition";
  pixel_x: number;
  pixel_y: number;
  ts: number;
  player_id: string;
  target_id: string | null;
}

export interface EventResponse {
  match_id: string;
  map: string;
  events: Event[];
}

export interface HeatmapData {
  map: string;
  heatmap_type: "kills" | "deaths" | "traffic";
  grid: number[][];
  grid_size: number;
  max_value: number;
}

// API Client Class
class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Maps endpoints
  async getMaps(): Promise<MapsResponse> {
    return this.request<MapsResponse>("/maps");
  }

  // Matches endpoints
  async getMatches(
    date?: string,
    map?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MatchListResponse> {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (map) params.append("map", map);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    return this.request<MatchListResponse>(`/matches?${params.toString()}`);
  }

  // Journey endpoints
  async getMatchJourney(matchId: string): Promise<JourneyResponse> {
    return this.request<JourneyResponse>(`/match/${matchId}/journey`);
  }

  // Events endpoints
  async getMatchEvents(
    matchId: string,
    eventType?: string
  ): Promise<EventResponse> {
    const params = new URLSearchParams();
    if (eventType) params.append("event_type", eventType);

    const query = params.toString();
    return this.request<EventResponse>(
      `/match/${matchId}/events${query ? "?" + query : ""}`
    );
  }

  // Heatmap endpoints
  async getHeatmap(
    map: string,
    type: "kills" | "deaths" | "traffic",
    dateStart?: string,
    dateEnd?: string,
    gridSize: number = 32
  ): Promise<HeatmapData> {
    const params = new URLSearchParams();
    if (dateStart) params.append("date_start", dateStart);
    if (dateEnd) params.append("date_end", dateEnd);
    params.append("grid_size", gridSize.toString());

    const query = params.toString();
    return this.request<HeatmapData>(
      `/heatmaps/${map}/${type}${query ? "?" + query : ""}`
    );
  }

  // Health check
  async getHealth(): Promise<{ status: string; debug: boolean }> {
    return this.request("/health");
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing
export default APIClient;
