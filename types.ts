
export interface User {
  id: string;
  name: string;
  joinedAt: string;
}

export interface SoulRecord {
  id: string;
  userId: string; // Track who won the soul
  name: string;
  phone: string;
  location: string;
  datePreached: string;
  followUpDays: number;
  churchRecommended: string;
  status: 'new' | 'following' | 'established';
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  soulCount: number;
}

export type ViewState = 'home' | 'mandate' | 'outreach' | 'ai-mentor' | 'training' | 'leaderboard' | 'profile';
