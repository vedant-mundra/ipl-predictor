export interface Match {
  id: number;
  team1: string;
  team2: string;
  team1Short: string;
  team2Short: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  venue: string;
}

export interface MatchResult {
  id: number;
  winner: string; // Full team name
}

export interface Prediction {
  matchId: number;
  team: string; // Full team name
  lockedAt?: string; // ISO timestamp
}

export interface Predictions {
  [matchId: string]: Prediction;
}

export interface SimulatedUser {
  id: string;
  name: string;
  avatar: string;
  predictions: {
    [matchId: string]: string; // matchId -> full team name
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  correct: number;
  total: number;
  isCurrentUser?: boolean;
}
