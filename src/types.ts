export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  summary?: string;
  keyThemes?: string[];
  insights?: string[];
  actionItems?: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ReflectionCategory =
  | 'General Reflection'
  | 'Gratitude'
  | 'Brainstorming'
  | 'Goal Planning'
  | 'Emotional Check-in'
  | 'Problem Solving'
  | 'Learning & Growth';

export const CATEGORIES: ReflectionCategory[] = [
  'General Reflection',
  'Gratitude',
  'Brainstorming',
  'Goal Planning',
  'Emotional Check-in',
  'Problem Solving',
  'Learning & Growth',
];

export type UserRole = 'USER' | 'ADMIN';

export interface UserOperationalMetadata {
  id: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Under Review' | 'Suspended';
  reflectionCount: number;
  lastActive: string;
  createdAt: string;
  // NOTE: Private journal content and messages are strictly EXCLUDED for privacy compliance
}

export interface AggregateAppMetrics {
  totalInteractions: number;
  activeUsersCount: number;
  categoryDistribution: Record<string, number>;
  modelUsage: Record<string, number>;
  averageConversationsPerEntry: number;
  totalSummariesGenerated: number;
  systemHealth: {
    geminiStatus: 'Operational' | 'Degraded' | 'Offline';
    firestoreStatus: 'Connected' | 'Error';
    apiLatencyMs: number;
    lastChecked: string;
  };
}

export interface SecurityAuditEvent {
  id: string;
  actorUid: string;
  actorEmail: string;
  action:
    | 'ADMIN_ACCESS_VERIFIED'
    | 'VIEW_AGGREGATE_METRICS'
    | 'VIEW_USER_OPERATIONAL_METADATA'
    | 'UPDATE_USER_OPERATIONAL_STATUS'
    | 'UPDATE_SYSTEM_RECORD'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'FLUSH_CACHE';
  targetResource: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'maintenance' | 'tip';
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

