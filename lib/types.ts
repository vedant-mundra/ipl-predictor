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
  userId: string;
  matchId: number;
  predictedTeam: string; // Full team name
  lockedAt?: string; // ISO timestamp
}

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  score?: number;
  isAdmin?: boolean;
  groupIds: string[];
}

export interface CurrentUser {
  id: string;
  username: string;
  isAdmin?: boolean;
  groupIds: string[];
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
  score: number;
  correct: number;
  total: number;
  isCurrentUser?: boolean;
}
